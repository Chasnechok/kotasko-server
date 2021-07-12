import { Type } from 'class-transformer'
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator'
import { User } from 'src/users/user.schema'

export class FileStoreDto {
    @IsString()
    originalname: string

    @IsString()
    owner: User

    @IsOptional()
    @IsString({ each: true })
    shared?: string[]

    @IsOptional()
    @IsMongoId({ each: true })
    readonly linkedTasks?: string[]
}

export class FileStoreAccessDto {
    @IsOptional()
    @IsString({ each: true })
    readonly shared?: string[]

    @IsOptional()
    @IsMongoId({ each: true })
    readonly linkedTasks?: string[]

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    readonly allSize?: number
}
