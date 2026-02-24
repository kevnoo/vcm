import { IsString } from 'class-validator';

export class ConfirmGameStatsDto {
  @IsString()
  teamId: string;
}
