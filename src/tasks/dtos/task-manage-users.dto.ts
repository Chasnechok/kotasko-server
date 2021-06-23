import { IsMongoId, IsString } from "class-validator";


export class TaskManageUsers {
    @IsMongoId()
    readonly taskId: string;

    @IsString({ each: true })
    readonly users: string[];
}