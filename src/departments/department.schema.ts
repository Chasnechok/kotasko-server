import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Organisation } from 'src/organisations/organisation.schema';
import { User } from '../users/user.schema';

@Schema()
export class Department extends Document {

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Organisation' })
  organisation: Organisation;

  @Prop({ type: MongooseSchema.Types.String, ref: 'User' })
  head: User;

}

export const DepartmentSchema = SchemaFactory.createForClass(Department);