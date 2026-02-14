import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ResolveResultDto {
  @IsInt()
  @Min(0)
  homeScore: number;

  @IsInt()
  @Min(0)
  awayScore: number;

  @IsString()
  @IsOptional()
  note?: string;
}
