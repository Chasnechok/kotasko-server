import { IsBoolean, IsIn, IsMongoId, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { User } from 'src/users/user.schema'

// sender will be added from session

export enum NotificationsTypes {
    NEW_TASK,
    UPDATE_TASK,
    COMPLETE_TASK,
    NEW_SHARED_FILE,
    SYSTEM,
    FILE_UNSHARED,
}

export class CreateNotificationDto {
    @IsString()
    @IsOptional()
    sender?: User

    @IsNumber()
    @IsIn(Object.values(NotificationsTypes))
    type: NotificationsTypes

    @IsString()
    receiver: User

    @IsMongoId()
    @ValidateIf((o) => o.type !== NotificationsTypes.SYSTEM && !o.referencedFile)
    referencedTask: Task

    @IsMongoId()
    @ValidateIf((o) => o.type !== NotificationsTypes.SYSTEM && !o.referencedTask)
    referencedFile: File

    @IsString()
    @IsOptional()
    details?: string
}
