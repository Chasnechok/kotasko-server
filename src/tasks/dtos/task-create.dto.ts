import { IsMongoId, IsOptional, IsString, Length } from 'class-validator'

export class TaskCreateDto {
    @IsString()
    @Length(3)
    readonly name: string

    @IsOptional()
    @IsString()
    readonly details?: string

    @IsOptional()
    @IsString({ each: true })
    readonly assignedTo?: string[]

    @IsOptional()
    @IsMongoId({ each: true })
    readonly attachments?: string[]
}
