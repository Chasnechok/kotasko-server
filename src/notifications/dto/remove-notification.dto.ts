import { IsMongoId } from 'class-validator'

export class RemoveNotificationDto {
    @IsMongoId()
    notificationId: string
}
