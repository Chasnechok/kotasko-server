import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class FileStoreDto {
  @IsString()
  originalname: string;

  @IsString()
  owner: string;

  @IsOptional()
  @IsString({ each: true })
  shared?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  readonly linkedTasks?: string[];
}

export class FileStoreAccessDto {
  @IsOptional()
  @IsString({ each: true })
  readonly shared?: string[];
}
