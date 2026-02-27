import { MediaType, DiscordChannelType } from '../enums';

export interface MatchMedia {
  id: string;
  matchId: string;
  discordMessageId: string | null;
  url: string;
  mediaType: MediaType;
  uploadedById: string | null;
  caption: string | null;
  createdAt: string;
}

export interface DiscordChannelMapping {
  id: string;
  competitionId: string;
  discordGuildId: string;
  discordChannelId: string;
  channelType: DiscordChannelType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelMappingDto {
  competitionId: string;
  discordGuildId: string;
  discordChannelId: string;
  channelType: DiscordChannelType;
}

export interface CreateMatchMediaDto {
  matchId: string;
  url: string;
  mediaType: MediaType;
  discordMessageId?: string;
  caption?: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
}

export type WebhookEvent =
  | 'result.submitted'
  | 'result.confirmed'
  | 'result.disputed'
  | 'result.resolved'
  | 'trade.created'
  | 'trade.countered'
  | 'trade.approved'
  | 'trade.rejected'
  | 'waiver.released'
  | 'waiver.claimed'
  | 'match.scheduled'
  | 'match.thread_created'
  | 'time.proposed'
  | 'time.accepted'
  | 'time.declined';
