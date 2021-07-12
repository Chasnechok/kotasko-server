import { forwardRef, Module } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { MessagesController } from './messages.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { NotificationsModule } from 'src/notifications/notifications.module'
import { Message, MessageSchema } from './message.schema'
import { TasksModule } from 'src/tasks/tasks.module'
import { ChoresModule } from 'src/chores/chores.module'
import { UsersModule } from 'src/users/users.module'
import { FilesModule } from 'src/files/files.module'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        NotificationsModule,
        forwardRef(() => ChoresModule),
        forwardRef(() => UsersModule),
        forwardRef(() => FilesModule),
        forwardRef(() => TasksModule),
    ],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
})
export class MessagesModule {}
