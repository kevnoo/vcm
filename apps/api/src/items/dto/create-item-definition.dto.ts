import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ItemEffectType } from '../../generated/prisma/client';

export class CreateItemDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ItemEffectType)
  effectType: ItemEffectType;

  @IsInt()
  @Min(1)
  effectValue: number;

  @IsInt()
  @Min(0)
  price: number;
}
