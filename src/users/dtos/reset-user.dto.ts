import { IsString } from "class-validator";

export class ResetUserDto {
    @IsString()
    readonly userId: string;
}