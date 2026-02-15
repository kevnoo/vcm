import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpdateSkillDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  skillGroupId?: string;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  defaultValue?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
