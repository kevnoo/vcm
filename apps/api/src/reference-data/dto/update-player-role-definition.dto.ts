import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Position } from '../../generated/prisma/client';

export class UpdatePlayerRoleDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Position)
  @IsOptional()
  position?: Position;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
