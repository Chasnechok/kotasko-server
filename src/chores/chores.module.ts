import { forwardRef, Module } from '@nestjs/common'
import { ChoresService } from './chores.service'
import { ChoresController } from './chores.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Chore, ChoreSchema } from './chore.schema'
import { MessagesModule } from 'src/messages/messages.module'
import { NotificationsModule } from 'src/notifications/notifications.module'
import { UsersModule } from 'src/users/users.module'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Chore.name, schema: ChoreSchema }]),
        forwardRef(() => MessagesModule),
        UsersModule,
        NotificationsModule,
    ],
    controllers: [ChoresController],
    providers: [ChoresService],
    exports: [ChoresService],
})
export class ChoresModule {}
