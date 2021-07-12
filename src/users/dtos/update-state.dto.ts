import { IsIn, IsMongoId, IsString } from 'class-validator'
import { UserStatesTypes } from '../user.schema'

export class UpdateUserStateDto {
    @IsMongoId()
    readonly userId: string

    @IsString()
    @IsIn(Object.values(UserStatesTypes))
    readonly value: UserStatesTypes
}
