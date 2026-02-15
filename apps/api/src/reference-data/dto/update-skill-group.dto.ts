import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSkillGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
