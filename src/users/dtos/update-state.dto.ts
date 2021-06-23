import { IsIn, IsString } from "class-validator";


export class UpdateUserStateDto {
    @IsString()
    readonly userId: string;

    @IsString()
    @IsIn(['created', 'active', 'archived'])
    readonly value: string;
}