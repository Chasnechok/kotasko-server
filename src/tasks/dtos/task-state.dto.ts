import { IsIn, IsMongoId, IsString } from "class-validator";

const TASK_STATES = [
    'created', 'solved', 'pendingReview', 'cancelled'
]

export class TaskStateDto {
    @IsMongoId()
    readonly taskId: string;

    @IsString()
    @IsIn(TASK_STATES)
    readonly value: string;
}