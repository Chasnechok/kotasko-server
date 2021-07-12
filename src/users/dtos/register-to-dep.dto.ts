import { IsMongoId, IsOptional } from 'class-validator'

export class AddDepDto {
    @IsMongoId()
    userId: string

    @IsMongoId()
    departmentId: string
}

export class ClearDepDto {
    @IsMongoId()
    userId: string

    @IsOptional()
    @IsMongoId()
    departmentId: string
}
