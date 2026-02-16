import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CounterTradeOfferDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  currencyOffered?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  currencyRequested?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  offeredPlayerIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  requestedPlayerIds?: string[];

  @IsString()
  @IsOptional()
  note?: string;
}
