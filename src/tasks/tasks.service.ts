import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { FileAccessModes } from 'src/files/dtos/file-access.dto'
import { FilesService } from 'src/files/files.service'
import { MessagesService } from 'src/messages/messages.service'
import { NotificationsTypes } from 'src/notifications/notification.schema'
import { NotificationsService } from 'src/notifications/notifications.service'
import ListPaginateDto from 'src/pagination/list-paginate.dto'
import { User, UserRoleTypes } from 'src/users/user.schema'
import { UsersService } from 'src/users/users.service'
import { TaskCreateDto } from './dtos/task-create.dto'
import { TaskManageModes, TaskManageUsers } from './dtos/task-manage-users.dto'
import { TaskStateDto } from './dtos/task-state.dto'
import { Task, TaskStates } from './task.schema'
import { Types } from 'mongoose'
import { PaginationService } from 'src/pagination/pagination.service'

@Injectable()
export class TasksService {
    constructor(
        @InjectModel(Task.name) private taskModel: Model<Task>,
        private notificationsService: NotificationsService,
        private messagesService: MessagesService,
        @Inject(forwardRef(() => FilesService))
        private filesService: FilesService,
        private usersService: UsersService,
        private paginationService: PaginationService
    ) {}

    async find(filters?: FilterQuery<Task>) {
        return this.taskModel.find(filters || {})
    }

    async createTask(dtoIn: TaskCreateDto, caller: User): Promise<Task> {
        const createdTask = new this.taskModel({ creator: caller, ...dtoIn })
        await createdTask.save()
        await this.notificationsService.create(caller, NotificationsTypes.NEW_TASK, createdTask.assignedTo, createdTask)
        if (createdTask.attachments) {
            for (const attachment of createdTask.attachments) {
                const dto = {
                    fileId: attachment.id,
                    taskIds: [createdTask.id],
                }
                await this.filesService.manageLinkedTasks(dto, caller, FileAccessModes.LINK_TASK)
            }
        }
        return createdTask
    }

    async setTaskState(dtoIn: TaskStateDto, caller: User, state: TaskStates) {
        const target = await this.getById(dtoIn.taskId)
        if (target.assignedTo.every((u) => u.id !== caller.id) && target.creator.id !== caller.id) {
            throw new ForbiddenException(`You are not allowed to manage ${dtoIn.taskId} task.`)
        }
        if (target.creator.id !== caller.id && state !== TaskStates.PENDING_REVIEW) {
            throw new ForbiddenException(`You are not allowed to manage ${dtoIn.taskId} task.`)
        }
        target.state = state
        const usersToNotify = target.assignedTo.concat(target.creator).filter((u) => u.id !== caller.id)
        await this.notificationsService.create(caller, NotificationsTypes.UPDATE_TASK, usersToNotify, target)
        return target.save()
    }

    async removeTask(taskId: string, caller: User) {
        const target = await this.getById(taskId)
        if (target.creator.id !== caller.id) {
            throw new ForbiddenException(`You are not allowed to manage ${taskId} task.`)
        }
        const usersFromTask = [target.creator, ...target.assignedTo]
        await this.notificationsService.removeForEntity<Task>(target, usersFromTask)
        await this.messagesService.removeForEntity<Task>(target)
        return target.delete()
    }

    async manageAccess(dtoIn: TaskManageUsers, caller: User, mode: TaskManageModes) {
        const target = await this.getById(dtoIn.taskId)
        if (target.creator.id !== caller.id) {
            throw new ForbiddenException(`You are not allowed to manage ${dtoIn.taskId} task.`)
        }
        if (dtoIn.userIds.includes(target.creator.id)) {
            throw new BadRequestException('You already own this task')
        }
        const additions = await this.usersService.findAll({
            _id: { $in: dtoIn.userIds, $nin: target.assignedTo.map((u) => u.id).concat(caller.id) },
        })
        // if mode === UNSHARE => means REMAINING users, as we are passing an array of users that should be removed
        const deletions = target.assignedTo.filter((user) => !dtoIn.userIds.includes(user.id))

        switch (mode) {
            case TaskManageModes.SET_USERS:
                target.assignedTo = await this.usersService.findAll({
                    _id: { $in: dtoIn.userIds, $nin: [caller.id] },
                })
                break
            case TaskManageModes.ADD_USERS:
                target.assignedTo = [...additions, ...target.assignedTo]
                break
            case TaskManageModes.REMOVE_USERS:
                target.assignedTo = deletions
        }

        if (additions && additions.length) {
            await this.notificationsService.create(caller, NotificationsTypes.NEW_TASK, additions, target)
        }

        if (deletions && deletions.length) {
            await this.notificationsService.removeForUsers(deletions, target, NotificationsTypes.TASK_UNASSIGNED)
        }
        return target.save()
    }

    async getById(taskId: string, user?: User): Promise<Task> {
        const task = await this.taskModel.findById(taskId).catch(() => {
            throw new BadRequestException(`DB error or ${taskId} is not a valid ObjectId.`)
        })
        if (!task) throw new NotFoundException(`Task with ${taskId} id was not found!`)
        if (user) {
            if (
                !user.roles.includes(UserRoleTypes.ADMIN) &&
                user.id !== task.creator.id &&
                !task.assignedTo.some((u) => u.id === user.id)
            ) {
                throw new ForbiddenException()
            }
        }
        return task
    }

    async listPaginate(dtoIn: ListPaginateDto, caller: User) {
        const addQuery = { $or: [{ creator: Types.ObjectId(caller.id) }, { assignedTo: Types.ObjectId(caller.id) }] }
        const { query, sort } = this.paginationService.generatePaginationQuery(dtoIn.cursor, addQuery, dtoIn.sort)
        const tasks = await this.taskModel.aggregate([
            { $match: query },
            {
                $sort: { createdAt: sort },
            },
            { $limit: dtoIn.limit },
            {
                $lookup: {
                    from: 'users',
                    let: { creatorId: '$creator' },
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                details: 1,
                                department: 1,
                                roles: 1,
                                bid: { $toObjectId: '$$creatorId' },
                            },
                        },
                        { $match: { $expr: { $eq: ['$_id', '$bid'] } } },
                        { $project: { bid: 0 } },
                    ],
                    as: 'creator',
                },
            },
            { $unwind: '$creator' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedTo',
                    foreignField: '_id',
                    as: 'assignedTo',
                },
            },
            {
                $lookup: {
                    from: 'files',
                    localField: 'attachments',
                    foreignField: '_id',
                    as: 'attachments',
                },
            },
            {
                $project: {
                    assignedTo: { details: 1, _id: 1 },
                    name: 1,
                    details: 1,
                    state: 1,
                    attachments: 1,
                    creator: 1,
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
        return tasks && tasks.length ? tasks[0] : {}
    }
}
