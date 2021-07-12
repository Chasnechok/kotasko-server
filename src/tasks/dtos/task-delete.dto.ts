import { IsMongoId } from 'class-validator'

export class TaskDeleteDto {
    @IsMongoId()
    readonly taskId: string
}
