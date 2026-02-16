import { TradeOfferStatus, WaiverStatus, TransactionType } from '../enums';
import { Team } from './team';
import { Player } from './player';
import { User } from './user';

// ─── League Settings ────────────────────────────────────
export interface LeagueSetting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLeagueSettingDto {
  value: string;
}

// ─── Player Value ───────────────────────────────────────
export interface PlayerValueBreakdown {
  baseValue: number;
  roleBonuses: number;
  playStyleBonuses: number;
  totalValue: number;
  weightedScore: number;
  groupScores: Record<string, number>;
}

// ─── Trade Offers ───────────────────────────────────────
export interface TradeOfferPlayer {
  id: string;
  playerId: string;
  offeredInId: string | null;
  requestedInId: string | null;
  player?: Player;
}

export interface TradeOffer {
  id: string;
  initiatingTeamId: string;
  receivingTeamId: string;
  currencyOffered: number;
  currencyRequested: number;
  status: TradeOfferStatus;
  parentOfferId: string | null;
  note: string | null;
  responseNote: string | null;
  adminNote: string | null;
  expiresAt: string | null;
  respondedAt: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  initTeam?: Team;
  recvTeam?: Team;
  approvedBy?: User | null;
  offeredPlayers?: TradeOfferPlayer[];
  requestedPlayers?: TradeOfferPlayer[];
}

export interface CreateTradeOfferDto {
  receivingTeamId: string;
  currencyOffered?: number;
  currencyRequested?: number;
  offeredPlayerIds?: string[];
  requestedPlayerIds?: string[];
  note?: string;
}

export interface RespondTradeOfferDto {
  responseNote?: string;
}

export interface CounterTradeOfferDto {
  currencyOffered?: number;
  currencyRequested?: number;
  offeredPlayerIds?: string[];
  requestedPlayerIds?: string[];
  note?: string;
}

export interface AdminTradeActionDto {
  adminNote?: string;
}

// ─── Free Agency ────────────────────────────────────────
export interface ClaimFreeAgentDto {
  teamId: string;
}

// ─── Waivers ────────────────────────────────────────────
export interface WaiverWire {
  id: string;
  playerId: string;
  releasedFromId: string | null;
  status: WaiverStatus;
  waiverPeriodDays: number;
  expiresAt: string;
  winningBidId: string | null;
  createdAt: string;
  updatedAt: string;
  player?: Player;
  releasedFrom?: Team | null;
  winningBid?: WaiverBid | null;
  bids?: WaiverBid[];
}

export interface WaiverBid {
  id: string;
  waiverWireId: string;
  teamId: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  team?: Team;
}

export interface ReleasePlayerDto {
  playerId: string;
}

export interface PlaceWaiverBidDto {
  amount: number;
}

// ─── Transaction Log ────────────────────────────────────
export interface Transaction {
  id: string;
  type: TransactionType;
  playerId: string;
  fromTeamId: string | null;
  toTeamId: string | null;
  currencyAmount: number | null;
  tradeOfferId: string | null;
  waiverWireId: string | null;
  note: string | null;
  executedById: string | null;
  createdAt: string;
  player?: Player;
  fromTeam?: Team | null;
  toTeam?: Team | null;
  tradeOffer?: TradeOffer | null;
  waiverWire?: WaiverWire | null;
  executedBy?: User | null;
}
