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
import { Socket, Server } from 'socket.io'
import { NotificationsService } from './notifications.service'

@UseGuards(AuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@WebSocketGateway({ namespace: 'notifications' })
export class NotificationsGateway {
    constructor(
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService
    ) {}

    @WebSocketServer()
    server: Server

    @SubscribeMessage('list')
    list(@ConnectedSocket() client) {
        return this.notificationsService.list(client.handshake.session.user, client)
    }

    @SubscribeMessage('createNotification')
    create(@MessageBody() dtoIn: Notification & { roomId: string }, @ConnectedSocket() client: Socket) {
        client.to(dtoIn.roomId).emit('notification', dtoIn)
        return
    }
}
