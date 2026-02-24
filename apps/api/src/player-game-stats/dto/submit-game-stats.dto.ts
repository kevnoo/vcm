import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
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

class PlayerGameStatEntryDto {
  @IsString()
  playerId: string;

  @IsEnum(Position)
  position: Position;

  @IsBoolean()
  isSubstitute: boolean;

  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;

  @IsInt()
  @Min(0)
  goals: number;

  @IsInt()
  @Min(0)
  assists: number;

  @IsInt()
  @Min(0)
  shots: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  shotAccuracy: number;

  @IsInt()
  @Min(0)
  passes: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  passAccuracy: number;

  @IsInt()
  @Min(0)
  dribbles: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  dribbleSuccessRate: number;

  @IsInt()
  @Min(0)
  tackles: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  tackleSuccessRate: number;

  @IsInt()
  @Min(0)
  offsides: number;

  @IsInt()
  @Min(0)
  foulsCommitted: number;

  @IsInt()
  @Min(0)
  possessionsWon: number;

  @IsInt()
  @Min(0)
  possessionsLost: number;

  @IsInt()
  @Min(0)
  @Max(120)
  minutesPlayed: number;

  @IsInt()
  @Min(0)
  yellowCards: number;

  @IsInt()
  @Min(0)
  redCards: number;

  // GK-only (optional)
  @IsOptional()
  @IsInt()
  @Min(0)
  shotsAgainst?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  shotsOnTarget?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  saves?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  goalsConceded?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  saveSuccessRate?: number;

  @IsOptional()
  @IsBoolean()
  cleanSheet?: boolean;
}

export class SubmitGameStatsDto {
  @IsString()
  teamId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerGameStatEntryDto)
  stats: PlayerGameStatEntryDto[];
}
