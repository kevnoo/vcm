import { IsInt, Min } from 'class-validator';

export class PlaceWaiverBidDto {
  @IsInt()
  @Min(1)
  amount: number;
}
