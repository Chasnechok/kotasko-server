import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    BaseWsExceptionFilter,
} from '@nestjs/websockets'
import { UseFilters, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import { ListMessagesDto } from './dtos/list.dto'
import { Message } from './message.schema'
import { Socket } from 'socket.io'
import { MessagesService } from './messages.service'

@UseGuards(AuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@WebSocketGateway({ namespace: 'chat' })
export class MessagesGateway {
    constructor(private readonly messagesService: MessagesService) {}

    @SubscribeMessage('room')
    async list(@MessageBody() dtoIn: ListMessagesDto, @ConnectedSocket() socket: Socket & { handshake: { session } }) {
        await this.messagesService.checkAccessWS(dtoIn.entityId, socket.handshake.session.user)
        return socket.join(dtoIn.entityId)
    }

    @SubscribeMessage('createMessage')
    async create(
        @MessageBody() dtoIn: Message & { roomId: string },
        @ConnectedSocket() socket: Socket & { handshake: { session } }
    ) {
        await this.messagesService.checkAccessWS(dtoIn.roomId, socket.handshake.session.user)
        socket.to(dtoIn.roomId).emit('message', dtoIn)
        return
    }
}
