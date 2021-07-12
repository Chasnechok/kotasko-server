import { IsIn, IsMongoId, IsString } from 'class-validator'
import { TaskStates } from '../task.schema'

export class TaskStateDto {
    @IsMongoId()
    readonly taskId: string

    @IsString()
    @IsIn(Object.values(TaskStates))
    readonly value: TaskStates
}
