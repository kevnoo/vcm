import { IsUUID } from 'class-validator';

export class UseItemDto {
  @IsUUID()
  teamItemId: string;

  @IsUUID()
  playerId: string;
}
