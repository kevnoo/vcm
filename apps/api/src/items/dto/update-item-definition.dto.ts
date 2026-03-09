import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ItemEffectType } from '../../generated/prisma/client';

export class UpdateItemDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ItemEffectType)
  @IsOptional()
  effectType?: ItemEffectType;

  @IsInt()
  @Min(1)
  @IsOptional()
  effectValue?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  minOverall?: number | null;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  maxOverall?: number | null;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  minPotential?: number | null;

  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  maxPotential?: number | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
