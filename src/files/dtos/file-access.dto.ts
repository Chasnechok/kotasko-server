import { IsMongoId, IsOptional, IsString } from 'class-validator'

export enum FileAccessModes {
    SHARE,
    UNSHARE,
    SET_SHARE,
    LINK_TASK,
    UNLINK_TASK,
    SET_LINKED_TASKS,
}

export class FileAccessUserDto {
    @IsMongoId()
    readonly fileId: string

    @IsOptional()
    @IsString({ each: true })
    readonly userIds: string[]
}

export class FileLinkedTasksDto {
    @IsMongoId()
    readonly fileId: string

    @IsOptional()
    @IsString({ each: true })
    readonly taskIds: string[]
}
