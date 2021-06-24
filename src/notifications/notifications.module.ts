import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Notification, NotificationSchema } from './notification.schema'
import { AuthModule } from 'src/auth/auth.module'

@Module({
    imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]), AuthModule],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
