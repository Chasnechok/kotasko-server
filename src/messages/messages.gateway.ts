import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    BaseWsExceptionFilter,
    WebSocketServer,
} from '@nestjs/websockets'
import { forwardRef, Inject, UseFilters, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import { ListMessagesDto } from './dtos/list.dto'
import { Socket, Server } from 'socket.io'
import { MessagesService } from './messages.service'

@UseGuards(AuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@WebSocketGateway({ namespace: 'chat' })
export class MessagesGateway {
    constructor(
        @Inject(forwardRef(() => MessagesService))
        private readonly messagesService: MessagesService
    ) {}

    @WebSocketServer()
    server: Server

    @SubscribeMessage('room')
    async list(@MessageBody() dtoIn: ListMessagesDto, @ConnectedSocket() socket: Socket & { handshake: { session } }) {
        await this.messagesService.checkAccessWS(dtoIn.entityId, socket.handshake.session.user)
        return socket.join(dtoIn.entityId)
    }
}
