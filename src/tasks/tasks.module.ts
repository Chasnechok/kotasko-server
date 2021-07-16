import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FilesModule } from 'src/files/files.module'
import { MessagesModule } from 'src/messages/messages.module'
import { NotificationsModule } from 'src/notifications/notifications.module'
import { UsersModule } from 'src/users/users.module'
import { Task, TaskSchema } from './task.schema'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
        forwardRef(() => MessagesModule),
        forwardRef(() => FilesModule),
        NotificationsModule,
        UsersModule,
    ],
    controllers: [TasksController],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule {}
