import { IsInt, IsUUID, Min } from 'class-validator';

export class BuyBundleDto {
  @IsUUID()
  bundleId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
