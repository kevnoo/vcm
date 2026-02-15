import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Position } from '../../generated/prisma/client';

export class UpdatePlayStyleDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Position)
  @IsOptional()
  position?: Position;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
