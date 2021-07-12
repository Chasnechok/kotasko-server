import { IsIn, IsMongoId, IsString } from 'class-validator'
import { ChoreTypes } from '../chore.schema'

export default class SetChoreType {
    @IsMongoId()
    choreId: string

    @IsString({ each: true })
    @IsIn(Object.values(ChoreTypes), { each: true })
    types: ChoreTypes[]
}
