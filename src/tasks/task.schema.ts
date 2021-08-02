import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { File } from 'src/files/file.schema'
import { MainModelNames } from 'src/main'
import { User } from 'src/users/user.schema'

export enum TaskStates {
    CREATED = 'CREATED',
    PENDING_REVIEW = 'PENDING_REVIEW',
    FINISHED = 'FINISHED',
}
// TODO deadline for tasks
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

    isCreator: (user: User) => boolean

    hasAccess: (user: User) => boolean

    getModelName: () => MainModelNames
}

export const TaskSchema = SchemaFactory.createForClass(Task)

TaskSchema.methods.isCreator = function (user: User): boolean {
    return this.creator && this.creator.id === user.id
}
TaskSchema.methods.hasAccess = function (user: User): boolean {
    const isCreator = this.isCreator(user)
    const assignedTo = this.assignedTo.some((u) => u.id === user.id)
    return isCreator || assignedTo
}
TaskSchema.methods.getModelName = () => MainModelNames.TASKS
