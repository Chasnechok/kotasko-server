import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Notification, NotificationsTypes } from './notification.schema'
import { Model } from 'mongoose'
import { User } from 'src/users/user.schema'
import { SetSeenNotificationDto } from './dto/set-seen-notification.dto'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { Chore } from 'src/chores/chore.schema'
import { RemoveNotificationDto } from './dto/remove-notification.dto'
import { Socket } from 'socket.io'
import { NotificationsGateway } from './notifications.gateway'
import { plainToClassFromExist } from 'class-transformer'

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>,
        @Inject(forwardRef(() => NotificationsGateway))
        private notificationGateway: NotificationsGateway
    ) {}

    async list(user: User, socket: Socket) {
        const nfs = await this.notificationModel.find({ receiver: user.id }).sort({ createdAt: -1 })
        await socket.join(user.id)
        return socket.emit('list', nfs)
    }

    async create(
        caller: User,
        type: NotificationsTypes,
        receivers: User[],
        referencedEntity: File | Chore | Task | User
    ) {
        if (!receivers || !referencedEntity) return
        switch (type) {
            case NotificationsTypes.CHORE_SOLVED:
            case NotificationsTypes.NEW_CHORE:
            case NotificationsTypes.NEW_CHORE_MESSAGE:
                return this.createForChore(caller, type, receivers, referencedEntity as Chore)
            case NotificationsTypes.COMPLETE_TASK:
            case NotificationsTypes.UPDATE_TASK:
            case NotificationsTypes.NEW_TASK:
            case NotificationsTypes.NEW_TASK_MESSAGE:
                return this.createForTask(caller, type, receivers, referencedEntity as Task)
            case NotificationsTypes.NEW_SHARED_FILE:
                return this.createForFile(caller, type, receivers, referencedEntity as File)

            default:
                throw new BadRequestException()
        }
    }

    private async createForFile(caller: User, type: NotificationsTypes, receivers: User[], referencedFile: File) {
        await this.notificationModel.deleteMany({
            referencedFile,
            receiver: { $in: receivers },
        })
        const dtoIn = receivers.map((r) => ({
            receiver: r,
            referencedFile,
            type,
        }))
        const created = await this.storeNotification(dtoIn, caller)
        if (created) {
            created.forEach((nf) => {
                this.emitNotification(nf.receiver.id, Object.assign(nf))
            })
        }
        return created
    }

    private async createForChore(caller: User, type: NotificationsTypes, receivers: User[], referencedChore: Chore) {
        await this.notificationModel.deleteMany({
            referencedChore,
            receiver: { $in: receivers },
        })
        const dtoIn = receivers.map((r) => ({
            receiver: r,
            referencedChore,
            type,
        }))
        const created = await this.storeNotification(dtoIn, caller)
        if (created) {
            created.forEach((nf) => {
                this.emitNotification(nf.receiver.id, Object.assign(nf))
            })
        }
        return created
    }

    private async createForTask(caller: User, type: NotificationsTypes, receivers: User[], referencedTask: Task) {
        await this.notificationModel.deleteMany({
            referencedTask,
            receiver: { $in: receivers },
        })
        const dtoIn = receivers.map((r) => ({
            receiver: r,
            referencedTask,
            type,
        }))
        const created = await this.storeNotification(dtoIn, caller)
        if (created) {
            created.forEach((nf) => {
                this.emitNotification(nf.receiver.id, Object.assign(nf))
            })
        }
        return created
    }

    async removeForUsers(
        receivers: User[],
        target: File | Chore | Task,
        type: Extract<
            NotificationsTypes,
            | NotificationsTypes.CHORE_REMOVED
            | NotificationsTypes.FILE_UNSHARED
            | NotificationsTypes.TASK_REMOVED
            | NotificationsTypes.TASK_UNASSIGNED
        >
    ) {
        if (!receivers || !receivers.length || !target) return
        const toDel = await this.notificationModel.find({
            receiver: { $in: receivers },
            $or: [{ referencedTask: target.id }, { referencedFile: target.id }, { referencedChore: target.id }],
        })
        if (toDel) {
            toDel.forEach((nf) => {
                this.emitNotification(nf.receiver.id, Object.assign(nf, { type }))
                nf.remove()
            })
        }
        return toDel
    }

    async removeForEntity<T extends User | Task | File | Chore>(entity: T, receivers: User[]) {
        const toDel = await this.notificationModel.find({
            $or: [{ referencedTask: entity.id }, { referencedFile: entity.id }, { referencedChore: entity.id }],
        })
        if (toDel) {
            const rooms = receivers.map((u) => u.id)
            toDel.forEach((nf) => {
                if (nf.referencedTask) {
                    this.emitNotification(rooms, Object.assign(nf, { type: NotificationsTypes.TASK_REMOVED }))
                }
                if (nf.referencedChore) {
                    this.emitNotification(rooms, Object.assign(nf, { type: NotificationsTypes.CHORE_REMOVED }))
                }
                if (nf.referencedFile) {
                    this.emitNotification(rooms, Object.assign(nf, { type: NotificationsTypes.FILE_UNSHARED }))
                }
                nf.remove()
            })
        }
        return toDel
    }

    async setSeenStatus(dtoIn: SetSeenNotificationDto, caller: User) {
        const target = await this.getById(dtoIn.notificationId)
        if (target.receiver.id !== caller.id) throw new ForbiddenException()
        target.isSeen = dtoIn.isSeen
        return target.save()
    }

    async remove(dtoIn: RemoveNotificationDto, caller: User) {
        const target = await this.getById(dtoIn.notificationId)
        if (target.receiver.id !== caller.id) throw new ForbiddenException()
        return target.remove()
    }

    private async getById(notificationId: string) {
        const notification = await this.notificationModel.findById(notificationId).catch((err) => {
            throw new BadRequestException(`DB error or ${notificationId} is not a valid ObjectId.`)
        })
        if (!notification) throw new NotFoundException(`Notification with ${notificationId} id was not found.`)
        return notification
    }

    private async emitNotification(rooms: string | string[], notification: Notification) {
        this.notificationGateway.server.to(rooms).emit('notification', notification)
    }

    private async storeNotification(dtoIn: CreateNotificationDto[], caller: User): Promise<Notification[]> {
        const nfsToCreate: CreateNotificationDto[] = []
        for (const nf of dtoIn) {
            if (nf.receiver.id !== caller.id) nfsToCreate.push(Object.assign(nf, { sender: caller }))
        }
        const created = await this.notificationModel.create(nfsToCreate)
        return created
    }
}
