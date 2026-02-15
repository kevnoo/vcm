import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Position } from '../../generated/prisma/client';

export class CreatePlayerRoleDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Position)
  position: Position;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
