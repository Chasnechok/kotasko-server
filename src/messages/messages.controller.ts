import { Controller, Get, UseGuards, Query, Session, Body, Post, Res } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import ReqWithSession from 'src/auth/models/req-with-session'
import { CreateMessageDto } from './dtos/message-create.dto'
import { MessagesService } from './messages.service'
import { Response } from 'express'

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get('subscribe')
    subscribe(@Query('busId') busId: string, @Res() res: Response, @Session() session) {
        res.set({
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        })
        return this.messagesService.subscribe(res, busId, session.user)
    }

    @Get('listForTask')
    listForTask(@Query('taskId') taskId: string, @Session() session: ReqWithSession) {
        return this.messagesService.listForTask(taskId, session.user)
    }

    @Get('listForChore')
    listForChore(@Query('choreId') choreId: string, @Session() session: ReqWithSession) {
        return this.messagesService.listForChore(choreId, session.user)
    }

    @Post('create')
    createMessage(@Body() dtoIn: CreateMessageDto, @Session() session: ReqWithSession) {
        return this.messagesService.create(dtoIn, session.user, dtoIn.type)
    }
}
