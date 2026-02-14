import { ResultStatus } from '../enums';
import { User } from './user';

export interface Result {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: ResultStatus;
  submittedById: string;
  disputedById: string | null;
  resolvedById: string | null;
  disputeReason: string | null;
  resolutionNote: string | null;
  submittedBy?: User;
  disputedBy?: User | null;
  resolvedBy?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitResultDto {
  homeScore: number;
  awayScore: number;
}

export interface DisputeResultDto {
  reason?: string;
}

export interface ResolveResultDto {
  homeScore: number;
  awayScore: number;
  note?: string;
}
