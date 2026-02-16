import { IsOptional, IsString } from 'class-validator';

export class RespondTradeOfferDto {
  @IsString()
  @IsOptional()
  responseNote?: string;
}
