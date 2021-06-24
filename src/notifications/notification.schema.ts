import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { User } from 'src/users/user.schema'
import { NotificationsTypes } from './dto/create-notification.dto'

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop()
    details?: string

    @Prop({ type: MongooseSchema.Types.String, ref: 'User', required: true })
    receiver: User | string

    @Prop({ type: MongooseSchema.Types.String, ref: 'User', required: false })
    sender?: User

    @Prop({ required: true })
    type: NotificationsTypes

    @Prop({ default: false })
    isSeen: boolean

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task', required: false })
    referencedTask?: Task

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File', required: false })
    referencedFile?: File
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
