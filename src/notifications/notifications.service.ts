import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter } from 'events'
import { CreateNotificationDto, NotificationsTypes } from './dto/create-notification.dto'
import { Response } from 'express'
import { InjectModel } from '@nestjs/mongoose'
import { Notification } from './notification.schema'
import { Model } from 'mongoose'
import { User } from 'src/users/user.schema'
import { SetSeenNotificationDto } from './dto/set-seen-notification.dto'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'

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
            if (notification.receiver === user._id) res.write(`data: ${JSON.stringify(notification)} \n\n`)
        }
        res.on('close', () => {
            NotificationEmmiter.removeListener('notification', onNotification)
        })
        NotificationEmmiter.on('notification', onNotification)
    }

    async list(user: User) {
        return this.notificationModel
            .find({ receiver: user._id })
            .populate({
                path: 'sender',
                select: 'details',
            })
            .populate('referencedFile')
            .populate('referencedTask')
            .sort({ createdAt: -1 })
    }

    // passing an array to support multiple notifications creation at once
    async create(dtoIn: CreateNotificationDto[], caller?: User) {
        const notifications = await this.storeNotification(dtoIn, caller)
        // resolving $lookup (populating)
        const res = await Promise.all(notifications)
        for (const notification of res) {
            this.emmitNotification(notification)
        }
        return res
    }

    async createForUsers(
        caller: User,
        type: NotificationsTypes,
        receivers: User[] | string[],
        referencedFile?: File,
        referencedTask?: Task
    ) {
        if (!receivers) return
        if (!Array.isArray(receivers)) receivers = [receivers]
        const dtoIn = receivers.map((r) => ({
            receiver: r,
            referencedFile,
            referencedTask,
            type,
        }))
        return await this.create(dtoIn, caller)
    }

    async removeForUsers(caller: User, receivers: User[] | string[], target) {
        await this.notificationModel.deleteMany({
            receiver: { $in: receivers },
            sender: caller,
            type: NotificationsTypes.NEW_SHARED_FILE || NotificationsTypes.NEW_TASK,
            $or: [{ referencedFile: target }, { referencedTask: target }],
        })
        for (const receiver of receivers) {
            const notification = {
                type: NotificationsTypes.FILE_UNSHARED,
                receiver,
                referencedFile: target,
                referencedTask: target,
            }
            NotificationEmmiter.emit('notification', notification)
        }
    }

    async setSeenStatus(dtoIn: SetSeenNotificationDto, caller: User) {
        const target = await this.getById(dtoIn.notificationId)
        if (target.receiver !== caller._id) throw new ForbiddenException()
        target.isSeen = dtoIn.isSeen
        return target.save()
    }

    private async getById(notificationId: string) {
        const notification = await this.notificationModel
            .findById(notificationId)
            .populate({
                path: 'sender',
                select: 'details',
            })
            .populate('referencedFile')
            .populate('referencedTask')
            .catch((err) => {
                throw new BadRequestException(`DB error or ${notificationId} is not a valid ObjectId.`)
            })
        if (!notification) throw new NotFoundException(`Notification with ${notificationId} id was not found.`)
        return notification
    }

    private emmitNotification(notification: Notification) {
        NotificationEmmiter.emit('notification', notification)
    }

    private async storeNotification(dtoIn: CreateNotificationDto[], caller?: User): Promise<Promise<Notification>[]> {
        for (const nf of dtoIn) {
            if (caller) {
                nf.sender = caller
            } else {
                nf.type = NotificationsTypes.SYSTEM
            }
        }
        const createdNfs = await this.notificationModel.create(dtoIn)
        return createdNfs.map((nf) =>
            nf
                .populate({
                    path: 'sender',
                    select: 'details',
                })
                .populate('referencedFile')
                .populate('referencedTask')
                .execPopulate()
        )
    }
}
