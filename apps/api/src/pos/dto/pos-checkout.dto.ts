import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PosItemDto {
  @IsUUID()
  itemDefinitionId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class PosBundleDto {
  @IsUUID()
  bundleId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class PosCheckoutDto {
  @IsUUID()
  teamId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosItemDto)
  items: PosItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosBundleDto)
  bundles: PosBundleDto[];
}
