import { Controller, UseGuards, Session, Body, Post } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import ReqWithSession from 'src/auth/models/req-with-session'
import { CreateMessageDto } from './dtos/message-create.dto'
import { MessagesService } from './messages.service'

@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Post('create')
    createMessage(@Body() dtoIn: CreateMessageDto, @Session() session: ReqWithSession) {
        return this.messagesService.create(dtoIn, session.user)
    }
}
