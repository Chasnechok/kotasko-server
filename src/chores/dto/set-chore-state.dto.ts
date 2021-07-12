import { IsIn, IsMongoId, IsString } from 'class-validator'
import { ChoreStates } from '../chore.schema'

export default class SetChoreState {
    @IsMongoId()
    choreId: string

    @IsString()
    @IsIn(Object.values(ChoreStates))
    state: ChoreStates
}
