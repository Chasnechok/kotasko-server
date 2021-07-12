import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { Organisation } from 'src/organisations/organisation.schema'
import { User } from '../users/user.schema'

@Schema({ timestamps: true })
export class Department extends Document {
    @Prop({ required: true })
    name: string

    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Organisation', autopopulate: true })
    organisation: Organisation

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', autopopulate: { select: 'details', maxDepth: 1 } })
    head: User

    @Prop({ required: false })
    address: string

    @Prop({ required: true, default: true })
    isServiceAllowed: boolean
}

export const DepartmentSchema = SchemaFactory.createForClass(Department)
