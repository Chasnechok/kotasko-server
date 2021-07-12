import { IsString } from 'class-validator'
import { RegisterUserDto } from 'src/auth/dtos/auth.dto'

export class CreateUserDto extends RegisterUserDto {
    @IsString()
    password: string
}
