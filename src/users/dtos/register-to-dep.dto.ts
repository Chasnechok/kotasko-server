import { IsMongoId, IsString } from 'class-validator';

export class ManageDepDto {
    
    @IsString()
    userId: string;
    
    @IsMongoId({ each: true })
    departmentIds: string[];

}