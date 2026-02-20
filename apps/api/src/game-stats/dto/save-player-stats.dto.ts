import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

enum MatchStatType {
  GOAL = 'GOAL',
  ASSIST = 'ASSIST',
  TACKLE = 'TACKLE',
  SAVE = 'SAVE',
}

class PlayerStatDto {
  @IsString()
  playerId: string;

  @IsEnum(MatchStatType)
  statType: MatchStatType;

  @IsInt()
  @Min(0)
  value: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minute?: number;
}

export class SavePlayerStatsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatDto)
  stats: PlayerStatDto[];
}
