import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Position } from '../../generated/prisma/client';

export class UpdatePlayerDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  age?: number;

  @IsEnum(Position)
  @IsOptional()
  primaryPosition?: Position;

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
  teamId?: string | null;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;
}
