import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { File } from 'src/files/file.schema';
import { User } from 'src/users/user.schema';

export class IMessage {
    
    @IsString()
    @Prop({ required: true })
    emmiter: string;

    @IsString()
    @IsIn(['system', 'user'])
    @Prop({ required: true })
    type: string;

    @IsString()
    @Prop({ required: true })
    content: string;

    @IsOptional()
    @IsString({ each: true })
    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'File' }] })
    attachments?: File[]

}

@Schema({ timestamps: true })
export class Task extends Document {

  @Prop({ required: true })
  name: string;

  @Prop()
  details: string;

  @Prop({ required: true, default: 'created' })
  state: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'File' }] })
  attachments: File[]

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  creator: User;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  assignedTo: User[];

  @Prop({ required: true, default: false })
  isServiceTask: boolean;

  @Prop([IMessage])
  messages: IMessage[];

}

export const TaskSchema = SchemaFactory.createForClass(Task);