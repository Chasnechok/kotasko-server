import { IsMongoId, IsOptional, IsString, Length } from "class-validator";

export class CreateOrganisationDto {
    @IsString()
    @Length(3, 30)
    name: string;

    @IsString()
    @IsOptional()
    head?: string;
}

export class GetHeadDto {
    @IsMongoId()
    orgId: string
}