import { Position, MatchStatType } from '../enums';
import { Player } from './player';

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
