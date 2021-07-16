import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ChoresService } from 'src/chores/chores.service'
import { FileAccessModes } from 'src/files/dtos/file-access.dto'
import { File } from 'src/files/file.schema'
import { FilesService } from 'src/files/files.service'
import { NotificationsTypes } from 'src/notifications/notification.schema'
import { NotificationsService } from 'src/notifications/notifications.service'
import { TasksService } from 'src/tasks/tasks.service'
import { User, UserRoleTypes } from 'src/users/user.schema'
import { CreateMessageDto } from './dtos/message-create.dto'
import { Message, MessagesTypes } from './message.schema'
import { EventEmitter } from 'events'
import { Response } from 'express'
import { UsersService } from 'src/users/users.service'

const MessagesEmmiter = new EventEmitter()
MessagesEmmiter.setMaxListeners(200)

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        private notificationsService: NotificationsService,
        private choresService: ChoresService,
        @Inject(forwardRef(() => FilesService))
        private filesService: FilesService,
        @Inject(forwardRef(() => TasksService))
        private tasksService: TasksService,
        private usersService: UsersService
    ) {}

    async subscribe(res: Response, busId: string, user: User) {
        function onMessage(message: Message, receivers: User[]) {
            // any authenticated user can connect to this bus => specify receivers to authorize receiving messages
            if (receivers.some((u) => u.id === user.id)) res.write(`data: ${JSON.stringify(message)} \n\n`)
        }
        res.on('close', () => {
            MessagesEmmiter.removeListener(busId, onMessage)
        })
        MessagesEmmiter.on(busId, onMessage)
    }

    async create(dtoIn: CreateMessageDto, sender: User, type: MessagesTypes) {
        switch (type) {
            case MessagesTypes.INTASK_MESSAGE:
            case MessagesTypes.INTASK_SYS_MESSAGE:
                return this.createForTask(dtoIn, sender, type)
            case MessagesTypes.INCHORE_MESSAGE:
            case MessagesTypes.INCHORE_SYS_MESSAGE:
                return this.createForChore(dtoIn, sender, type)
            default:
                throw new BadRequestException('Unsupported message type')
        }
    }

    async removeForEntity<T>(entity: T) {
        try {
            await this.messageModel.deleteMany({ $or: [{ referencedChore: entity }, { referencedTask: entity }] })
        } catch (error) {
            throw new InternalServerErrorException(`There was a probem while removing messages`)
        }
        return
    }

    private async createForChore(dtoIn: CreateMessageDto, sender: User, type: MessagesTypes) {
        const target = await this.choresService.getById(dtoIn.referencedEntity)
        if (target.creator.id !== sender.id && !sender.roles.includes(UserRoleTypes.TECHNICIAN)) {
            throw new ForbiddenException()
        }
        if (dtoIn.attachments) {
            delete dtoIn.attachments
        }
        const notificationReceivers = [target.creator, ...target.solvers]
        const messageReceivers = (await this.usersService.findTechnicians()).concat(target.creator)
        if (notificationReceivers.length && type !== MessagesTypes.INCHORE_SYS_MESSAGE) {
            await this.notificationsService.create(
                sender,
                NotificationsTypes.NEW_CHORE_MESSAGE,
                notificationReceivers,
                target
            )
        }
        const message = new this.messageModel({ ...dtoIn, sender, type, referencedChore: target })
        await message.save()
        this.emitMessage(target.id, message, messageReceivers)
        return message
    }

    private async createForTask(dtoIn: CreateMessageDto, sender: User, type: MessagesTypes) {
        const target = await this.tasksService.getById(dtoIn.referencedEntity)
        if (target.creator.id !== sender.id && !target.assignedTo.some((u) => u.id === sender.id)) {
            throw new ForbiddenException()
        }
        let attachments: File[]
        if (dtoIn.attachments) {
            attachments = await this.filesService.findFiles({
                _id: { $in: dtoIn.attachments },
            })
            if (attachments.some((at) => at.owner.id !== sender.id)) {
                throw new ForbiddenException()
            }
            for (const attachment of attachments) {
                const dto = {
                    fileId: attachment.id,
                    taskIds: [target.id],
                }
                await this.filesService.manageLinkedTasks(dto, sender, FileAccessModes.LINK_TASK)
            }
        }
        const notificationReceivers = [...target.assignedTo, target.creator]
        if (notificationReceivers.length && type !== MessagesTypes.INTASK_SYS_MESSAGE) {
            await this.notificationsService.create(
                sender,
                NotificationsTypes.NEW_TASK_MESSAGE,
                notificationReceivers,
                target
            )
        }
        const message = new this.messageModel({ ...dtoIn, sender, type, referencedTask: target })
        await message.save()
        await this.emitMessage(target.id, message, notificationReceivers)
        return message
    }

    async listForTask(taskId: string, caller: User) {
        const target = await this.tasksService.getById(taskId)
        if (target.creator.id !== caller.id && !target.assignedTo.some((u) => u.id === caller.id)) {
            throw new ForbiddenException()
        }
        return this.messageModel.find({
            referencedTask: target,
        })
    }

    async listForChore(choreId: string, caller: User) {
        const target = await this.choresService.getById(choreId)
        if (target.creator.id !== caller.id && !caller.roles.includes(UserRoleTypes.ADMIN)) {
            throw new ForbiddenException()
        }
        return this.messageModel.find({
            referencedChore: target,
        })
    }

    private emitMessage(busId: string, message: Message, receivers: User[]) {
        if (!Array.isArray(receivers)) receivers = [receivers]
        MessagesEmmiter.emit(busId, message, receivers)
    }
}
