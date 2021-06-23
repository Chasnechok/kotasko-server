import { IsString, Length } from "class-validator";

export class SetUserPasswordDto {
    
    @IsString()
    readonly userId: string

    @IsString()
    @Length(6, 30)
    readonly value: string;
}