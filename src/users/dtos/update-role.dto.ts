import { IsIn, IsString } from "class-validator";

export class UpdateUserRoleDto {
    @IsString()
    readonly userId: string;

    @IsString()
    @IsIn(['admin', 'user', 'technician'])
    readonly value: string;
}