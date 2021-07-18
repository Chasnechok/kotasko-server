import { Controller, UseGuards, Session, Body, Post, Get, Query } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import ReqWithSession from 'src/auth/models/req-with-session'
import { ListMessagesDto } from './dtos/list.dto'
import { CreateMessageDto } from './dtos/message-create.dto'
import { MessagesService } from './messages.service'

@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get()
    list(@Query() dtoIn: ListMessagesDto, @Session() session: ReqWithSession) {
        return this.messagesService.list(dtoIn.entityId, session.user)
    }

    @Post('create')
    createMessage(@Body() dtoIn: CreateMessageDto, @Session() session: ReqWithSession) {
        return this.messagesService.create(dtoIn, session.user)
    }
}
