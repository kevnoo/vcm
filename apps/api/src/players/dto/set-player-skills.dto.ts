import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsUUID, Max, Min, ValidateNested } from 'class-validator';

class SkillValueDto {
  @IsUUID()
  skillDefinitionId: string;

  @IsInt()
  @Min(0)
  @Max(99)
  value: number;
}

export class SetPlayerSkillsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SkillValueDto)
  skills: SkillValueDto[];
}
