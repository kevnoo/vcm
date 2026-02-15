import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Position } from '../../generated/prisma/client';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsEnum(Position)
  primaryPosition: Position;

  @IsUUID()
  @IsOptional()
  teamId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
