import { IsMongoId } from 'class-validator'

export class IdChoreDto {
    @IsMongoId()
    choreId: string
}
