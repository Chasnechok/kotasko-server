import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    BaseWsExceptionFilter,
} from '@nestjs/websockets'
import { MessagesService } from './messages.service'
import { UseFilters, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import { ListMessagesDto } from './dtos/list.dto'
import { Message } from './message.schema'
import { Socket } from 'socket.io'

@UseGuards(AuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@WebSocketGateway({ namespace: 'chat' })
export class MessagesGateway {
    constructor(private readonly messagesService: MessagesService) {}

    @SubscribeMessage('list')
    list(@MessageBody() dtoIn: ListMessagesDto, @ConnectedSocket() client) {
        return this.messagesService.list(dtoIn.entityId, client.handshake.session.user, client)
    }

    @SubscribeMessage('createMessage')
    create(@MessageBody() dtoIn: Message & { roomId: string }, @ConnectedSocket() client: Socket) {
        client.to(dtoIn.roomId).emit('message', dtoIn)
        return
    }
}
