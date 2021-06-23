import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/user.schema';
import { TaskCreateDto } from './dtos/task-create.dto';
import { Task } from './task.schema';

@Injectable()
export class TasksService {
    constructor(@InjectModel(Task.name) private taskModel: Model<Task>){}
    

    async createTask(dtoIn: TaskCreateDto, caller: User) {
        dtoIn.creator = caller.id;
        const createdTask = new this.taskModel(dtoIn);
        return createdTask;
    }

}
