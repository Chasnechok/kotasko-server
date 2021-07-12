import { Type } from 'class-transformer'
import {
    IsIn,
    IsMongoId,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
    ValidateNested,
} from 'class-validator'
import { IUserDetails, UserRoleTypes } from 'src/users/user.schema'

export class LoginUserDto {
    @IsString()
    @Length(3, 60)
    login: string

    @IsString()
    password: string
}

export class RegisterUserDto {
    @IsString()
    @Length(3, 60)
    login: string

    @IsOptional()
    @IsIn(Object.values(UserRoleTypes), { each: true })
    @IsString({ each: true })
    roles?: UserRoleTypes[]

    @IsOptional()
    @IsMongoId()
    department: string

    @IsOptional()
    @IsObject()
    @Type(() => IUserDetails)
    @ValidateNested()
    details?: IUserDetails

    // max 10GB, -1 for unlimited
    @IsOptional()
    @IsNumber()
    @Max(10737412742)
    @Min(-1)
    quota?: number
}
