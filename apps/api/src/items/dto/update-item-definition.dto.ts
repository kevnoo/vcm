import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
