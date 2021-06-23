import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { nanoid } from 'nanoid';
import { Department } from '../departments/department.schema';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop(raw({
    type: String,
    default: () => nanoid(10)
  }))
  _id: Record<string, any>;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Department' }] })
  departments: Department[] | any;
  
  @Prop(raw({
    firstName: { type: String },
    lastName: { type: String }
  }))
  details: Record<string, any>;

  @Prop({ required: true, default: 'created' })
  state: string;
}

export const UserSchema = SchemaFactory.createForClass(User);