import { IsMongoId, IsOptional, IsString, Length } from "class-validator";

export class CreateDepartmentDto {
    @IsString()
    @Length(3, 30)
    name: string;

    @IsMongoId()
    organisation: string;

    @IsString()
    @IsOptional()
    head?: string;
}

export class DepartmentIdDto {
    @IsMongoId()
    depId: string
}