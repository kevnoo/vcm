import { Position, MatchStatType, GameStatsStatus, StatDisputeStatus } from '../enums';
import { Player } from './player';
import { User } from './user';
import { Team } from './team';

export interface MatchLineupEntry {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  position: Position;
  isStarter: boolean;
  player?: Player;
}

export interface MatchSubstitution {
  id: string;
  matchId: string;
  teamId: string;
  playerInId: string;
  playerOutId: string;
  minute: number;
  playerIn?: Player;
  playerOut?: Player;
}

export interface MatchPlayerStat {
  id: string;
  matchId: string;
  playerId: string;
  statType: MatchStatType;
  value: number;
  minute: number | null;
  player?: Player;
}

export interface MatchStats {
  matchId: string;
  homeLineup: MatchLineupEntry[];
  awayLineup: MatchLineupEntry[];
  substitutions: MatchSubstitution[];
  playerStats: MatchPlayerStat[];
}

export interface PlayerMinutes {
  playerId: string;
  player?: Player;
  minutesPlayed: number;
}

// DTOs
export interface SaveLineupDto {
  entries: {
    playerId: string;
    position: Position;
    isStarter: boolean;
  }[];
}

export interface SaveSubstitutionsDto {
  substitutions: {
    playerInId: string;
    playerOutId: string;
    minute: number;
  }[];
}

export interface SavePlayerStatsDto {
  stats: {
    playerId: string;
    statType: MatchStatType;
    value: number;
    minute?: number;
  }[];
}

// ─── Player Game Stats (per-match summary) ────────────────

export interface MatchPlayerGameStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  submittedById: string;
  position: Position;
  isSubstitute: boolean;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  shotAccuracy: number;
  passes: number;
  passAccuracy: number;
  dribbles: number;
  dribbleSuccessRate: number;
  tackles: number;
  tackleSuccessRate: number;
  offsides: number;
  foulsCommitted: number;
  possessionsWon: number;
  possessionsLost: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  // GK-only
  shotsAgainst: number | null;
  shotsOnTarget: number | null;
  saves: number | null;
  goalsConceded: number | null;
  saveSuccessRate: number | null;
  cleanSheet: boolean | null;
  status: GameStatsStatus;
  createdAt: string;
  updatedAt: string;
  player?: Player;
  team?: Team;
  submittedBy?: User;
  disputes?: StatDispute[];
}

export interface StatDispute {
  id: string;
  gameStatsId: string;
  fieldName: string;
  disputedById: string;
  reason: string | null;
  status: StatDisputeStatus;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  disputedBy?: User;
  resolvedBy?: User | null;
}

export interface StatDelegate {
  id: string;
  teamId: string;
  delegateUserId: string;
  createdAt: string;
  delegate?: User;
}

// ─── DTOs ────────────────

export interface PlayerGameStatEntry {
  playerId: string;
  position: Position;
  isSubstitute: boolean;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  shotAccuracy: number;
  passes: number;
  passAccuracy: number;
  dribbles: number;
  dribbleSuccessRate: number;
  tackles: number;
  tackleSuccessRate: number;
  offsides: number;
  foulsCommitted: number;
  possessionsWon: number;
  possessionsLost: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  // GK-only (optional)
  shotsAgainst?: number;
  shotsOnTarget?: number;
  saves?: number;
  goalsConceded?: number;
  saveSuccessRate?: number;
  cleanSheet?: boolean;
}

export interface SubmitGameStatsDto {
  teamId: string;
  stats: PlayerGameStatEntry[];
}

export interface DisputeStatFieldDto {
  fields: {
    fieldName: string;
    reason?: string;
  }[];
}

export interface ResolveStatDisputeDto {
  correctedValue?: number | boolean;
  note?: string;
}

export interface ConfirmGameStatsDto {
  teamId: string;
}

export interface AddStatDelegateDto {
  delegateUserId: string;
}

// ─── Aggregation types ────────────────

export interface PlayerSeasonStats {
  playerId: string;
  competitionId: string;
  matchesPlayed: number;
  avgRating: number;
  totalGoals: number;
  totalAssists: number;
  totalShots: number;
  avgShotAccuracy: number;
  totalPasses: number;
  avgPassAccuracy: number;
  totalDribbles: number;
  avgDribbleSuccessRate: number;
  totalTackles: number;
  avgTackleSuccessRate: number;
  totalOffsides: number;
  totalFoulsCommitted: number;
  totalPossessionsWon: number;
  totalPossessionsLost: number;
  totalMinutesPlayed: number;
  totalYellowCards: number;
  totalRedCards: number;
  // GK
  totalSaves: number | null;
  totalGoalsConceded: number | null;
  avgSaveSuccessRate: number | null;
  totalCleanSheets: number | null;
}

export interface LeaderboardEntry {
  playerId: string;
  player?: Player;
  team?: Team;
  value: number;
}
