import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class SubstitutionDto {
  @IsString()
  playerInId: string;

  @IsString()
  playerOutId: string;

  @IsInt()
  @Min(1)
  minute: number;
}

export class SaveSubstitutionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubstitutionDto)
  substitutions: SubstitutionDto[];
}
