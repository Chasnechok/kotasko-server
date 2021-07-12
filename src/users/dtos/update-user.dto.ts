import { IsIn, IsMongoId, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'
import { Department } from 'src/departments/department.schema'
import { IUserDetails, UserRoleTypes } from '../user.schema'
import { Type } from 'class-transformer'

export class UpdateUserDto {
    @IsMongoId()
    readonly userId: string

    @IsOptional()
    @IsIn(Object.values(UserRoleTypes), { each: true })
    @IsString({ each: true })
    readonly roles?: UserRoleTypes[]

    @IsOptional()
    @IsObject()
    @Type(() => IUserDetails)
    @ValidateNested()
    readonly details?: IUserDetails

    @IsOptional()
    @IsMongoId()
    readonly department?: Department

    @IsOptional()
    @IsNumber()
    @Max(10737412742)
    @Min(-1)
    readonly quota?: number
}
