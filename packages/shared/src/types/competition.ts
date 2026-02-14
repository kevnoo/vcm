import { CompetitionType, CompetitionStatus } from '../enums';
import { Team } from './team';
import { Match } from './match';

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  status: CompetitionStatus;
  config: Record<string, unknown> | null;
  teams?: CompetitionTeam[];
  rounds?: Round[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionTeam {
  id: string;
  competitionId: string;
  teamId: string;
  seed: number | null;
  team?: Team;
}

export interface Round {
  id: string;
  competitionId: string;
  roundNumber: number;
  name: string | null;
  matches?: Match[];
  createdAt: string;
}

export interface CreateCompetitionDto {
  name: string;
  type: CompetitionType;
  config?: Record<string, unknown>;
}

export interface AddTeamsDto {
  teamIds: string[];
}
