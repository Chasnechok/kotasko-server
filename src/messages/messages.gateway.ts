import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets'
import { MessagesService } from './messages.service'
import { Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import { CreateMessageDto } from './dtos/message-create.dto'
import { ListForTaskDto } from './dtos/list-for-task.dto'

@UseGuards(AuthGuard)
@WebSocketGateway({ namespace: 'chat' })
export class MessagesGateway {
    constructor(private readonly messagesService: MessagesService) {}

    @SubscribeMessage('message')
    create(@MessageBody() dtoIn: CreateMessageDto, @Session() session) {
        console.log(dtoIn)
        console.log(session)

        return this.messagesService.create(dtoIn, session.user, dtoIn.type)
    }

    @SubscribeMessage('listForTask')
    listForTask(@MessageBody() dtoIn: ListForTaskDto, @Session() session) {
        console.log(dtoIn)
        console.log(session)
        return { ok: true }

        return this.messagesService.listForTask(dtoIn.taskId, session.user)
    }

    @SubscribeMessage('listForChore')
    listForChore(@MessageBody('choreId') choreId: string, @Session() session) {
        return this.messagesService.listForChore(choreId, session.user)
    }
}
