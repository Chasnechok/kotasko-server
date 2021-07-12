import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter } from 'events'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { Response } from 'express'
import { InjectModel } from '@nestjs/mongoose'
import { Notification, NotificationsTypes } from './notification.schema'
import { Model } from 'mongoose'
import { User } from 'src/users/user.schema'
import { SetSeenNotificationDto } from './dto/set-seen-notification.dto'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { Chore } from 'src/chores/chore.schema'
import { RemoveNotificationDto } from './dto/remove-notification.dto'

const NotificationEmmiter = new EventEmitter()
NotificationEmmiter.setMaxListeners(200)

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>
    ) {}

    async subscribe(res: Response, user: User) {
        function onNotification(notification: Notification) {
            if (typeof notification.receiver === 'string') {
                if (notification.receiver === user.id) res.write(`data: ${JSON.stringify(notification)} \n\n`)
            } else {
                if (notification.receiver.id === user.id) res.write(`data: ${JSON.stringify(notification)} \n\n`)
            }
        }
        res.on('close', () => {
            NotificationEmmiter.removeListener('notification', onNotification)
        })
        NotificationEmmiter.on('notification', onNotification)
    }

    async list(user: User) {
        return this.notificationModel.find({ receiver: user.id }).sort({ createdAt: -1 })
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
        for (const notification of created) {
            this.emmitNotification(notification)
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
        for (const notification of created) {
            this.emmitNotification(notification)
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
        for (const notification of created) {
            this.emmitNotification(notification)
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
        if (!receivers || !receivers.length) return
        await this.notificationModel.deleteMany({
            receiver: { $in: receivers },
            $or: [{ referencedTask: target.id }, { referencedFile: target.id }, { referencedChore: target.id }],
        })
        for (const receiver of receivers) {
            const notification = {
                type,
                receiver,
            }
            NotificationEmmiter.emit('notification', notification)
        }
    }

    async removeAllForFile(file: File, receivers?: User[]) {
        await this.notificationModel.deleteMany({
            referencedFile: file,
        })
        if (receivers) {
            for (const receiver of receivers) {
                const notification = {
                    type: NotificationsTypes.FILE_UNSHARED,
                    receiver,
                    referencedFile: file,
                }
                NotificationEmmiter.emit('notification', notification)
            }
        }
    }

    async removeAllForTask(task: Task, receivers?: User[]) {
        await this.notificationModel.deleteMany({
            referencedTask: task,
        })
        if (receivers) {
            for (const receiver of receivers) {
                const notification = {
                    type: NotificationsTypes.TASK_REMOVED,
                    receiver,
                    referencedTask: task,
                }
                NotificationEmmiter.emit('notification', notification)
            }
        }
    }

    async removeAllForChore(chore: Chore, receivers?: User[]) {
        await this.notificationModel.deleteMany({
            referencedChore: chore,
        })
        if (receivers) {
            for (const receiver of receivers) {
                const notification = {
                    type: NotificationsTypes.CHORE_REMOVED,
                    receiver,
                    referencedChore: chore,
                }
                NotificationEmmiter.emit('notification', notification)
            }
        }
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

    private emmitNotification(notification: Notification) {
        NotificationEmmiter.emit('notification', notification)
    }

    private async storeNotification(dtoIn: CreateNotificationDto[], caller: User): Promise<Notification[]> {
        const nfToCreate: CreateNotificationDto[] = []
        for (const nf of dtoIn) {
            if (nf.receiver.id !== caller.id) nfToCreate.push(Object.assign(nf, { sender: caller }))
        }
        const created = await this.notificationModel.create(nfToCreate)
        if (!created) {
            return []
        }
        return created
    }
}
