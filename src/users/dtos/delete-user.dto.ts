import { ArrayNotEmpty, IsMongoId } from 'class-validator'

export class DeleteUsersDto {
    @IsMongoId({ each: true })
    @ArrayNotEmpty()
    userIds: string[]
}
