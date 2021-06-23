import { IsAlphanumeric, IsArray, IsIn, IsObject, IsOptional, IsString, Length, ValidateNested } from "class-validator";

export class LoginUserDto {
    @IsString()
    @Length(3, 30)
    login: string;

    @IsString()
    password: string;
}

export interface IUserDetails {
    firstName: string;
    lastName: string;
}

export class RegisterUserDto {

    @IsString()
    @Length(3, 30)
    @IsAlphanumeric()
    login: string;

    @IsOptional()
    @IsString()
    @Length(6, 30)
    password?: string;

    @IsOptional()
    @IsIn(['admin', 'technician', 'user'])
    @IsString()
    role?: string;

    @IsOptional()
    @IsArray()
    departments?: string[];

    @IsOptional()
    @IsObject()
    @ValidateNested()
    details?: IUserDetails
}