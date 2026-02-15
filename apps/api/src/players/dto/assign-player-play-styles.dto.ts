import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { PlayStyleLevel } from '../../generated/prisma/client';

class PlayStyleAssignmentDto {
  @IsUUID()
  playStyleDefinitionId: string;

  @IsEnum(PlayStyleLevel)
  level: PlayStyleLevel;
}

export class AssignPlayerPlayStylesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayStyleAssignmentDto)
  playStyles: PlayStyleAssignmentDto[];
}
