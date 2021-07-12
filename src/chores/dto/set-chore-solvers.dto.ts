import { IsIn, IsMongoId, IsString } from 'class-validator'

export class SetChoreSolvers {
    @IsMongoId()
    choreId: string
    @IsString()
    @IsIn(['delete', 'add'])
    mode: 'delete' | 'add'
}
