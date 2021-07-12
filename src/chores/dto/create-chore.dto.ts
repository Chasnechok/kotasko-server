import { IsNotEmpty, IsString } from 'class-validator'

export class CreateChoreDto {
    @IsString()
    @IsNotEmpty()
    details: string
}
