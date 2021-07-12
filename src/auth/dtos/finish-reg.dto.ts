import { IsMobilePhone, IsMongoId, IsOptional, IsString, Length } from 'class-validator'
import { Department } from 'src/departments/department.schema'

export class FinishRegDto {
    @IsOptional()
    @IsString()
    @Length(6, 30)
    password: string

    @IsOptional()
    @IsMongoId()
    department?: Department

    @IsOptional()
    @IsString()
    room?: string

    @IsOptional()
    @IsString()
    @IsMobilePhone('uk-UA')
    mobile?: string
}
