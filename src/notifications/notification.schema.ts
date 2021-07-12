import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { Chore } from 'src/chores/chore.schema'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { User } from 'src/users/user.schema'

export enum NotificationsTypes {
    NEW_TASK,
    UPDATE_TASK,
    NEW_TASK_MESSAGE,
    COMPLETE_TASK,
    NEW_SHARED_FILE,
    SYSTEM,
    FILE_UNSHARED,
    TASK_UNASSIGNED,
    TASK_REMOVED,
    NEW_CHORE,
    NEW_CHORE_MESSAGE,
    CHORE_SOLVED,
    CHORE_REMOVED,
    CHORE_UPDATED,
}

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop()
    details?: string

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: { select: 'details', maxDepth: 1 },
    })
    receiver: User

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: false,
        autopopulate: { select: 'details', maxDepth: 1 },
    })
    sender?: User

    @Prop({ required: true })
    type: NotificationsTypes

    @Prop({ default: false })
    isSeen: boolean

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task', required: false, autopopulate: true })
    referencedTask?: Task

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chore', required: false, autopopulate: true })
    referencedChore?: Chore

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File', required: false, autopopulate: true })
    referencedFile?: File
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
