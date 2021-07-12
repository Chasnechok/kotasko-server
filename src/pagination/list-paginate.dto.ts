import { Type } from 'class-transformer'
import { IsIn, IsMongoId, IsNumber, IsOptional } from 'class-validator'

export default class ListPaginateDto {
    @IsMongoId()
    @IsOptional()
    cursor?: string

    @Type(() => Number)
    @IsNumber()
    limit: number

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsIn([1, -1])
    sort?: 1 | -1
}
