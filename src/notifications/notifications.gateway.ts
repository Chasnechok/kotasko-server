import {
    WebSocketGateway,
    SubscribeMessage,
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
}
