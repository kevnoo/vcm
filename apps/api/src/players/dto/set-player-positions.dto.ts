import { IsArray, IsEnum } from 'class-validator';
import { Position } from '../../generated/prisma/client';

export class SetPlayerPositionsDto {
  @IsArray()
  @IsEnum(Position, { each: true })
  alternativePositions: Position[];
}
