import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateSkillDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  skillGroupId: string;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  defaultValue?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
