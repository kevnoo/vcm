import { IsOptional, IsString } from 'class-validator';

export class DisputeResultDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
