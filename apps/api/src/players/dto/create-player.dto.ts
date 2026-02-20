import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
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

  @IsInt()
  @Min(1)
  @IsOptional()
  overall?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  weakFoot?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  potential?: number;

  @IsArray()
  @IsEnum(Position, { each: true })
  @IsOptional()
  alternativePositions?: Position[];

  @IsUUID()
  @IsOptional()
  teamId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
