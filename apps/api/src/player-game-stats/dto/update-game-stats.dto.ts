import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateGameStatsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  minutesPlayed?: number;
}
