import { IsUUID } from 'class-validator';

export class ClaimFreeAgentDto {
  @IsUUID()
  teamId: string;
}
