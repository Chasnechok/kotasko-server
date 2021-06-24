import { IsBoolean, IsMongoId } from 'class-validator';

export class SetSeenNotificationDto {
  @IsMongoId()
  notificationId: string;

  @IsBoolean()
  isSeen: boolean;
}
