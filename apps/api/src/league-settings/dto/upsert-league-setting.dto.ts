import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertLeagueSettingDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}
