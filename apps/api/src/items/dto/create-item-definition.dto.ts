import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
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

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  minOverall?: number;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  maxOverall?: number;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  minPotential?: number;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  maxPotential?: number;
}
