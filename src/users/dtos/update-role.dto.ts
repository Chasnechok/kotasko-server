import { Type } from 'class-transformer'
import { IsIn, IsMongoId, IsString } from 'class-validator'
import { UserRoleTypes } from '../user.schema'
import { Types } from 'mongoose'

export class UpdateUserRoleDto {
    @IsMongoId()
    @Type(() => Types.ObjectId)
    readonly userId: string

    @IsString()
    @IsIn(Object.values(UserRoleTypes))
    readonly value: UserRoleTypes
}
