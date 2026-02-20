import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

enum Position {
  GK = 'GK',
  RB = 'RB',
  CB = 'CB',
  LB = 'LB',
  CDM = 'CDM',
  CM = 'CM',
  CAM = 'CAM',
  RM = 'RM',
  LM = 'LM',
  RW = 'RW',
  LW = 'LW',
  CF = 'CF',
  ST = 'ST',
}

class LineupEntryDto {
  @IsString()
  playerId: string;

  @IsEnum(Position)
  position: Position;

  @IsBoolean()
  isStarter: boolean;
}

export class SaveLineupDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupEntryDto)
  entries: LineupEntryDto[];
}
