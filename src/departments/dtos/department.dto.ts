import { IsBoolean, IsMongoId, IsOptional, IsString, Length } from 'class-validator'

export class CreateDepartmentDto {
    @IsString()
    @Length(3, 100)
    name: string

    @IsMongoId()
    organisation: string

    @IsOptional()
    @IsBoolean()
    isServiceAllowed: boolean

    @IsOptional()
    @IsString()
    head?: string

    @IsString()
    @Length(3, 100)
    address: string
}

export class UpdateDepartmentDto extends CreateDepartmentDto {}

export class DepartmentIdDto {
    @IsMongoId()
    depId: string
}
