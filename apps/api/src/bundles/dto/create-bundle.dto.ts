import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class CreateBundleItemDto {
  @IsUUID()
  itemDefinitionId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBundleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateBundleItemDto)
  items: CreateBundleItemDto[];
}
