import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Task } from 'src/tasks/task.schema';
import { User } from 'src/users/user.schema';

@Schema({ timestamps: true })
export class File extends Document {
  @Prop({ required: true })
  originalname: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: MongooseSchema.Types.String, ref: 'User', required: true })
  owner: User | any;

  @Prop({ type: [{ type: MongooseSchema.Types.String, ref: 'User' }] })
  shared: User[] | any;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Task' }] })
  linkedTasks: Task[];
}

export const FileSchema = SchemaFactory.createForClass(File);
