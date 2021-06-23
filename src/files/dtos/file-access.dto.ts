import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export enum ManageAccessModes {
  SHARE,
  UNSHARE,
  LINK_TASK,
  UNLINK_TASK,
}

export class FileAccessDto {
  @IsMongoId()
  readonly fileId: string;

  @IsOptional()
  @IsString({ each: true })
  readonly userIds?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  readonly taskIds?: string[];

  @IsOptional()
  @IsBoolean()
  readonly rewrite?: boolean;
}
