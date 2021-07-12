import { IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { MessagesTypes } from '../message.schema'

// sender will be added from session
export class CreateMessageDto {
    @IsMongoId()
    referencedEntity: string

    @IsString()
    @IsNotEmpty()
    content: string

    @IsIn(Object.values(MessagesTypes))
    type: MessagesTypes

    @IsOptional()
    @IsMongoId({ each: true })
    attachments: string[]
}
