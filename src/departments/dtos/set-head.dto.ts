import { IsMongoId, IsString } from "class-validator";

export class SetDepHeadDto {
    @IsMongoId()
    depId: string;

    @IsString()
    userId: string;
}