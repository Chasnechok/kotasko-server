import { ArrayNotEmpty, IsArray } from 'class-validator'

export class DeleteUsersDto {
    @IsArray()
    @ArrayNotEmpty()
    userIds: string[]
}