import { IsMongoId, IsString } from 'class-validator'

export enum TaskManageModes {
    SET_USERS,
    REMOVE_USERS,
    ADD_USERS,
}

export class TaskManageUsers {
    @IsMongoId()
    readonly taskId: string

    @IsString({ each: true })
    readonly userIds: string[]
}
