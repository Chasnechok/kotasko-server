import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { File } from 'src/files/file.schema'
import { User } from 'src/users/user.schema'

export enum TaskStates {
    CREATED = 'CREATED',
    PENDING_REVIEW = 'PENDING_REVIEW',
    FINISHED = 'FINISHED',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Task extends Document {
    @Prop({ required: true })
    name: string

    @Prop()
    details: string

    @Prop({ required: true, default: TaskStates.CREATED })
    state: TaskStates

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'File', autopopulate: { maxDepth: 1 } }] })
    attachments: File[]

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: { select: 'details', maxDepth: 1 },
    })
    creator: User

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User', autopopulate: { select: 'details', maxDepth: 1 } }],
    })
    assignedTo: User[]

    @Prop({ index: -1 })
    createdAt: Date
}

export const TaskSchema = SchemaFactory.createForClass(Task)
