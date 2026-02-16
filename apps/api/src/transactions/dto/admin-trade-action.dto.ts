import { IsOptional, IsString } from 'class-validator';

export class AdminTradeActionDto {
  @IsString()
  @IsOptional()
  adminNote?: string;
}
