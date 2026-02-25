import { IsOptional, IsString } from 'class-validator';

export class ResolveStatDisputeDto {
  @IsOptional()
  correctedValue?: number | boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
