import { TimeProposalStatus } from '../enums';
import { User } from './user';
import { Match } from './match';

export interface MatchMessage {
  id: string;
  matchId: string;
  authorId: string;
  content: string;
  author?: User;
  createdAt: string;
}

export interface TimeProposal {
  id: string;
  matchId: string;
  proposedById: string;
  proposedTime: string;
  status: TimeProposalStatus;
  respondedById: string | null;
  respondedAt: string | null;
  proposedBy?: User;
  respondedBy?: User | null;
  createdAt: string;
}

export type MatchHubRole = 'ADMIN' | 'INVOLVED' | 'VIEWER';

export interface MatchHub {
  match: Match;
  role: MatchHubRole;
  messages?: MatchMessage[];
  timeProposals?: TimeProposal[];
}

export interface CreateMatchMessageDto {
  content: string;
}

export interface CreateTimeProposalDto {
  proposedTime: string;
}

export interface RespondTimeProposalDto {
  response: 'ACCEPTED' | 'DECLINED';
}
