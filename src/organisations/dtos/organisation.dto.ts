import { IsMongoId, IsOptional, IsString, Length } from 'class-validator'

export class CreateOrganisationDto {
    @IsString()
    @Length(3, 100)
    name: string

    @IsString()
    @Length(3, 100)
    address: string

    @IsString()
    @IsOptional()
    head?: string
}

export class GetHeadDto {
    @IsMongoId()
    orgId: string
}
