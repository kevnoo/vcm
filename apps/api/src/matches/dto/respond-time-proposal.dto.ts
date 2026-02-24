import { IsIn } from 'class-validator';

export class RespondTimeProposalDto {
  @IsIn(['ACCEPTED', 'DECLINED'])
  response: 'ACCEPTED' | 'DECLINED';
}
