import { IsMongoId, IsString, Length } from 'class-validator'

export class SetUserPasswordDto {
    @IsMongoId()
    readonly userId: string

    @IsString()
    @Length(6, 30)
    readonly value: string
}
