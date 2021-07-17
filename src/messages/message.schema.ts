import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { Chore } from 'src/chores/chore.schema'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { User } from 'src/users/user.schema'

export enum MessagesTypes {
    INTASK_MESSAGE,
    INTASK_SYS_MESSAGE,
    PRIVATE_MESSAGE,
    INCHORE_MESSAGE,
    INCHORE_SYS_MESSAGE,
}

@Schema({ timestamps: true })
export class Message extends Document {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: { select: 'details', maxDepth: 1 },
    })
    sender: User

    @Prop({ required: true })
    type: MessagesTypes

    @Prop({ required: true })
    content: string

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: false,
        autopopulate: { select: 'details', maxDepth: 1 },
    })
    receiver?: User

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task', required: false, autopopulate: { maxDepth: 2 } })
    referencedTask?: Task

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chore', required: false, autopopulate: { maxDepth: 2 } })
    referencedChore?: Chore

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'File', autopopulate: { maxDepth: 1 } }] })
    attachments?: File[]
}

export const MessageSchema = SchemaFactory.createForClass(Message)
