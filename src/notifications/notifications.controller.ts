import { Controller, Get, Post, Body, UseGuards, Res, Session, Patch, Delete, Query } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { Response } from 'express'
import { SetSeenNotificationDto } from './dto/set-seen-notification.dto'
import ReqWithSession from 'src/auth/models/req-with-session'
import { RemoveNotificationDto } from './dto/remove-notification.dto'

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    subscribe(@Res() res: Response, @Session() session) {
        res.set({
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        })
        return this.notificationsService.subscribe(res, session.user)
    }

    @Get('list')
    list(@Session() session: ReqWithSession) {
        return this.notificationsService.list(session.user)
    }

    @Patch('setSeenStatus')
    setSeenStatus(@Body() dtoIn: SetSeenNotificationDto, @Session() session: ReqWithSession) {
        return this.notificationsService.setSeenStatus(dtoIn, session.user)
    }

    @Delete()
    remove(@Query() removeQuery: RemoveNotificationDto, @Session() session: ReqWithSession) {
        return this.notificationsService.remove(removeQuery, session.user)
    }
}
