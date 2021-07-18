import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    BaseWsExceptionFilter,
    WebSocketServer,
} from '@nestjs/websockets'
import { UseFilters, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import { Socket, Server } from 'socket.io'

@UseGuards(AuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@WebSocketGateway({ namespace: 'notifications' })
export class NotificationsGateway {
    constructor() {}

    @WebSocketServer()
    server: Server

    @SubscribeMessage('room')
    list(@ConnectedSocket() client: Socket & { handshake: { session } }) {
        const user = client.handshake.session.user
        return client.join(user.id)
    }

    @SubscribeMessage('createNotification')
    create(@MessageBody() dtoIn: Notification & { roomId: string }, @ConnectedSocket() client: Socket) {
        client.to(dtoIn.roomId).emit('notification', dtoIn)
        return
    }
}
