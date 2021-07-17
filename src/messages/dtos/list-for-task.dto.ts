import { IsMongoId } from 'class-validator'

export class ListForTaskDto {
    @IsMongoId()
    taskId: string
}
