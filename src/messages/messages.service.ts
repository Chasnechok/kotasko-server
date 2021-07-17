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
import { Types } from 'mongoose'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        private notificationsService: NotificationsService,
        private choresService: ChoresService,
        @Inject(forwardRef(() => FilesService))
        private filesService: FilesService,
        @Inject(forwardRef(() => TasksService))
        private tasksService: TasksService
    ) {}

    async create(dtoIn: CreateMessageDto, sender: User) {
        switch (dtoIn.type) {
            case MessagesTypes.INTASK_MESSAGE:
            case MessagesTypes.INTASK_SYS_MESSAGE:
                return this.createForTask(dtoIn, sender, dtoIn.type)
            case MessagesTypes.INCHORE_MESSAGE:
            case MessagesTypes.INCHORE_SYS_MESSAGE:
                return this.createForChore(dtoIn, sender, dtoIn.type)
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

    async list(entityId, caller: User, socket: Socket) {
        if (!entityId || !Types.ObjectId.isValid(entityId)) throw new WsException('entityId must be a mongoId')
        const msgs = await this.messageModel.find({
            $or: [{ referencedTask: entityId }, { referencedChore: entityId }, { sender: entityId }],
        })
        const sample = msgs && msgs.length ? msgs[0] : null
        if (sample) {
            if (
                (sample.referencedTask && !sample.referencedTask.hasAccess(caller)) ||
                (sample.referencedChore && !sample.referencedChore.hasAccess(caller))
            ) {
                throw new WsException('Forbidden')
            }
        }
        await socket.join(entityId)
        return socket.emit('list', msgs)
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
        return message
    }
}
