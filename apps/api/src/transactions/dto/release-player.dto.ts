import { IsUUID } from 'class-validator';

export class ReleasePlayerDto {
  @IsUUID()
  playerId: string;
}
