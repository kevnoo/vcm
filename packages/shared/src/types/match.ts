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
  homeTeam?: Team & { owner?: { id: string } };
  awayTeam?: Team & { owner?: { id: string } };
  result?: Result | null;
  round?: { id: string; roundNumber: number; name: string | null; competition?: { id: string; name: string } };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMatchDto {
  homeTeamId?: string;
  awayTeamId?: string;
  scheduledAt?: string | null;
}
