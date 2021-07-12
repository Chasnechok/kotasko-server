import { IsBoolean, IsIn, IsMongoId, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator'
import { File } from 'src/files/file.schema'
import { Task } from 'src/tasks/task.schema'
import { User } from 'src/users/user.schema'
import { NotificationsTypes } from '../notification.schema'

// sender will be added from session

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
    referencedTask?: Task

    @IsMongoId()
    @ValidateIf((o) => o.type !== NotificationsTypes.SYSTEM && !o.referencedTask)
    referencedFile?: File

    @IsString()
    @IsOptional()
    details?: string
}
