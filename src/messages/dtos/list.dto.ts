import { IsMongoId } from 'class-validator'

export class ListMessagesDto {
    @IsMongoId()
    entityId: string
}
