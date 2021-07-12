import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { User } from '../users/user.schema'

@Schema({ timestamps: true })
export class Organisation extends Document {
    @Prop({ required: true })
    name: string

    @Prop({ required: true })
    address: string

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', autopopulate: { select: 'details', maxDepth: 1 } })
    head: User
}

export const OrganisationSchema = SchemaFactory.createForClass(Organisation)
