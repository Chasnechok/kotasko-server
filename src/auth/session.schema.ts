import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'

@Schema({})
export class Session extends Document {
    @Prop()
    _id: string

    @Prop()
    expires: MongooseSchema.Types.Date

    @Prop()
    lastModified: MongooseSchema.Types.Date

    @Prop()
    session: string
}

export const SessionSchema = SchemaFactory.createForClass(Session)
