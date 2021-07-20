import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { File } from './file.schema'
import { access, unlink } from 'fs/promises'
import { constants, createReadStream } from 'fs'
import * as path from 'path'
import { Readable } from 'stream'
import { FileAccessUserDto, FileLinkedTasksDto, FileAccessModes } from './dtos/file-access.dto'
import { NotificationsService } from 'src/notifications/notifications.service'
import { User, UserRoleTypes } from 'src/users/user.schema'
import { TasksService } from 'src/tasks/tasks.service'
import { UsersService } from 'src/users/users.service'
import { NotificationsTypes } from 'src/notifications/notification.schema'
import { PaginationService } from 'src/pagination/pagination.service'
import ListPaginateDto from 'src/pagination/list-paginate.dto'
import { Types } from 'mongoose'

@Injectable()
export class FilesService {
    constructor(
        @InjectModel(File.name) private fileModel: Model<File>,
        private notificationsService: NotificationsService,
        private tasksService: TasksService,
        private usersService: UsersService,
        private paginationService: PaginationService
    ) {}

    async findFiles(filters?: FilterQuery<File>) {
        return this.fileModel.find(filters || {})
    }

    async calcSpaceUsed(user: User): Promise<number> {
        const req = await this.fileModel.aggregate([
            { $match: { owner: Types.ObjectId(user.id) } },
            {
                $group: {
                    _id: null,
                    spaceUsed: { $sum: '$size' },
                },
            },
        ])
        const spaceUsed = req && req.length ? req[0].spaceUsed : 0
        return spaceUsed
    }

    async manageUsersAccess(dto: FileAccessUserDto, caller: User, mode: FileAccessModes) {
        const target = await this.getById(dto.fileId)
        if (!target.isOwner(caller)) {
            throw new ForbiddenException(`You are not allowed to manage ${dto.fileId} file.`)
        }
        const additions = await this.usersService.findAll({
            _id: {
                $in: dto.userIds,
                $nin: target.shared.map((u) => u.id).concat(caller.id),
            },
        })
        // if mode === UNSHARE => means REMAINING users, as we are passing an array of users that should be removed
        const deletions = target.shared.filter((user) => !dto.userIds.includes(user.id))

        switch (mode) {
            case FileAccessModes.SET_SHARE:
                target.shared = await this.usersService.findAll({
                    _id: {
                        $in: dto.userIds,
                        $nin: [caller.id],
                    },
                })
                break
            case FileAccessModes.SHARE:
                target.shared = [...additions, ...target.shared]
                break
            case FileAccessModes.UNSHARE:
                target.shared = deletions
        }

        if (additions && additions.length) {
            this.notificationsService.create(caller, NotificationsTypes.NEW_SHARED_FILE, additions, target)
        }

        if (deletions && deletions.length) {
            this.notificationsService.removeForUsers(deletions, target, NotificationsTypes.FILE_UNSHARED)
        }
        return target.save()
    }

    async manageLinkedTasks(dto: FileLinkedTasksDto, caller: User, mode: FileAccessModes) {
        const target = await this.getById(dto.fileId)

        if (!target.isOwner(caller)) {
            throw new ForbiddenException(`You are not allowed to manage ${dto.fileId} file.`)
        }
        const additions = await this.tasksService.find({
            _id: {
                $in: dto.taskIds,
                $nin: target.linkedTasks.map((t) => t.id),
            },
        })
        // if mode === UNLINK_TASK => means REMAINING tasks, as we are passing an array of tasks that should be removed
        const deletions = target.linkedTasks.filter((task) => !dto.taskIds.includes(task.id))

        switch (mode) {
            case FileAccessModes.SET_LINKED_TASKS:
                target.linkedTasks = await this.tasksService.find({
                    _id: {
                        $in: dto.taskIds,
                        $nin: [caller.id],
                    },
                })
                break
            case FileAccessModes.LINK_TASK:
                target.linkedTasks = [...additions, ...target.linkedTasks]
                break
            case FileAccessModes.UNLINK_TASK:
                target.linkedTasks = deletions
        }
        return target.save()
    }

    async downloadFile(fileId: string, caller: User): Promise<File> {
        const fileMeta = await this.getById(fileId)
        if (!fileMeta.hasAccess(caller)) {
            throw new ForbiddenException()
        }
        const filePath = this.getStoringPath(fileMeta.filename)
        try {
            await access(filePath, constants.F_OK)
        } catch (error) {
            await fileMeta.delete()
            throw new NotFoundException(`File with ${fileId} id was not found in the file system!`)
        }
        return fileMeta
    }

    async uploadFiles(
        files: Array<File & Express.Multer.File>,
        caller: User,
        shared?: string[],
        linkedTasks?: string[]
    ): Promise<File[]> {
        if (!files || !files.length) return
        const areValid =
            files.every((file) => file.originalname && file.mimetype && file.path && file.filename) && caller.id
        if (!areValid) {
            await Promise.all(files.map((file) => unlink(file.path).catch(console.error)))
            throw new BadRequestException('Upload failed: files are not valid!')
        }
        const sizes = files.map((file) => file.size)
        const allSize = sizes.reduce((acc, curr) => acc + curr)
        if (allSize > caller.quota - caller.spaceUsed && caller.quota !== -1) {
            await Promise.all(files.map((file) => unlink(file.path).catch(console.error)))
            throw new BadRequestException('Files exceed user quota')
        }
        const user = await this.usersService.findById(caller.id)
        user.spaceUsed = user.spaceUsed + allSize
        user.save()
        files.forEach((file) => (file.owner = caller))
        if (shared && shared.length) {
            const sharedUsers = await this.usersService.findAll({
                _id: { $in: shared },
            })
            files.forEach((file) => (file.shared = sharedUsers))
        }
        if (linkedTasks && linkedTasks.length) {
            const tasks = await this.tasksService.find({
                _id: { $in: linkedTasks },
            })
            files.forEach((file) => (file.linkedTasks = tasks))
        }
        const storedFiles = await this.storeToDB(files)
        storedFiles.forEach((file) =>
            this.notificationsService.create(caller, NotificationsTypes.NEW_SHARED_FILE, file.shared, file)
        )
        return storedFiles
    }

    async removeFile(fileId: string, caller: User) {
        const target = await this.getById(fileId)
        if (!target.isOwner(caller)) {
            throw new ForbiddenException('You are trying to remove another user`s file!')
        }
        try {
            const deletions = target.shared
            const user = await this.usersService.findById(caller.id)
            user.spaceUsed = user.spaceUsed - target.size
            await this.notificationsService.removeForEntity<File>(target, deletions)
            await target.delete()
            await user.save()
            await unlink(this.getStoringPath(target.filename))
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException()
        }
        return target
    }

    private async storeToDB(files: Array<File & Express.Multer.File>): Promise<File[]> {
        const dtoIn = files.map((file) => ({
            originalname: file.originalname,
            filename: file.filename,
            owner: file.owner,
            mimetype: file.mimetype,
            size: file.size,
            shared: file.shared || [],
        }))
        const storedFiles = await this.fileModel
            .insertMany(dtoIn, {
                populate: {
                    path: 'owner',
                    select: 'details',
                },
            })
            .catch((err) => {
                throw new InternalServerErrorException(err)
            })
        return storedFiles
    }

    async listPaginate(dtoIn: ListPaginateDto, caller: User) {
        const addQuery = { $or: [{ owner: Types.ObjectId(caller.id) }, { shared: Types.ObjectId(caller.id) }] }
        const { query, sort } = this.paginationService.generatePaginationQuery(dtoIn.cursor, addQuery, dtoIn.sort)
        const files = await this.fileModel.aggregate([
            { $match: query },
            {
                $sort: { createdAt: sort },
            },
            { $limit: dtoIn.limit },
            {
                $lookup: {
                    from: 'users',
                    let: { ownerId: '$owner' },
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                details: 1,
                                department: 1,
                                roles: 1,
                                bid: { $toObjectId: '$$ownerId' },
                            },
                        },
                        { $match: { $expr: { $eq: ['$_id', '$bid'] } } },
                        { $project: { bid: 0 } },
                    ],
                    as: 'owner',
                },
            },
            { $unwind: '$owner' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'shared',
                    foreignField: '_id',
                    as: 'shared',
                },
            },
            {
                $project: {
                    shared: { details: 1, _id: 1 },
                    owner: 1,
                    originalname: 1,
                    mimetype: 1,
                    size: 1,
                    createdAt: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    data: {
                        $push: '$$ROOT',
                    },
                    nextCursor: { $last: '$_id' },
                },
            },
            {
                $project: { _id: 0 },
            },
        ])
        return files && files.length ? files[0] : {}
    }

    async getById(fileId: string): Promise<File> {
        const file = await this.fileModel.findById(fileId).catch((err) => {
            throw new BadRequestException(`DB error or ${fileId} is not a valid ObjectId.`)
        })
        if (!file) throw new NotFoundException(`File with ${fileId} id was not found!`)
        return file
    }

    getReadableStream(filePath: string): Readable {
        try {
            const stream = createReadStream(filePath)
            return stream
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException(`There was a problem while downloading a file.`)
        }
    }

    getStoringPath(filename?: string) {
        return path.resolve(__dirname, '../../..', `userFiles/${filename || ''}`)
    }
}
