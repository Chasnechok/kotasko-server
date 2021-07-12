import { IsMongoId } from 'class-validator'

export class ResetUserDto {
    @IsMongoId()
    readonly userId: string
}
