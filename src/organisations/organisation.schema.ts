import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../users/user.schema';

@Schema()
export class Organisation extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.String, ref: 'User' })
  head: User;
  
}

export const OrganisationSchema = SchemaFactory.createForClass(Organisation);