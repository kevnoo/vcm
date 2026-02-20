import { MatchStatus } from '../enums';
import { Team } from './team';
import { Result } from './result';

export interface Match {
  id: string;
  roundId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchNumber: number | null;
  scheduledAt: string | null;
  status: MatchStatus;
  homeTeam?: Team;
  awayTeam?: Team;
  result?: Result | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMatchDto {
  homeTeamId?: string;
  awayTeamId?: string;
  scheduledAt?: string | null;
}
