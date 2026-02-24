import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTimeProposalDto {
  @IsDateString()
  @IsNotEmpty()
  proposedTime: string;
}
