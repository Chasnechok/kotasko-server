import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { Task } from 'src/tasks/task.schema'
import { User } from 'src/users/user.schema'

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class File extends Document {
    @Prop({ required: true })
    originalname: string

    @Prop({ required: true })
    filename: string

    @Prop({ required: true })
    mimetype: string

    @Prop({ required: true })
    size: number

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: { select: 'details', maxDepth: 1 },
    })
    owner: User

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User', autopopulate: { select: 'details', maxDepth: 1 } }],
    })
    shared: User[]

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Task', autopopulate: { maxDepth: 1 } }] })
    linkedTasks: Task[]

    @Prop({ index: -1 })
    createdAt: Date

    isOwner: (user: User) => boolean

    hasAccess: (user: User) => boolean
}

export const FileSchema = SchemaFactory.createForClass(File)
FileSchema.methods.isOwner = function (user: User): boolean {
    return this.owner && this.owner.id === user.id
}
FileSchema.methods.hasAccess = function (user: User): boolean {
    const isOwner = this.isOwner(user)
    const inShared = this.shared.some((us) => us.id === user.id)
    const inLinkedTasks =
        this.linkedTasks.some((lt) => lt.assignedTo.includes(user.id) || lt.assignedTo.some((u) => u.id === user.id)) ||
        this.linkedTasks.some((lt) => lt.creator === user.id || lt.creator?.id === user.id)
    return isOwner || inShared || inLinkedTasks
}
