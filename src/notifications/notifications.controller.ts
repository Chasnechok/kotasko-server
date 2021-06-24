import { Controller, Get, Post, Body, UseGuards, Res, Req, Patch } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { Response } from 'express'
import { SetSeenNotificationDto } from './dto/set-seen-notification.dto'
import { ValidationPipe } from 'src/validation.pipe'
import ReqWithSession from 'src/auth/models/req-with-session'

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post()
    create(@Body(new ValidationPipe()) createNotificationDto: CreateNotificationDto, @Req() req: ReqWithSession) {
        return this.notificationsService.create([createNotificationDto], req.user)
    }
    @Get()
    subscribe(@Res() res: Response, @Req() req) {
        res.set({
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        })
        return this.notificationsService.subscribe(res, req.user)
    }

    @Get('list')
    list(@Req() req: ReqWithSession) {
        return this.notificationsService.list(req.user)
    }

    @Patch('setSeenStatus')
    setSeenStatus(@Body(new ValidationPipe()) dtoIn: SetSeenNotificationDto, @Req() req: ReqWithSession) {
        return this.notificationsService.setSeenStatus(dtoIn, req.user)
    }
}
