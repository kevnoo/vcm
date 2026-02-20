import { ItemEffectType } from '../enums';
import { Team } from './team';
import { Player } from './player';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string | null;
  effectType: ItemEffectType;
  effectValue: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamItem {
  id: string;
  teamId: string;
  itemDefinitionId: string;
  quantity: number;
  team?: Team;
  itemDefinition?: ItemDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface ItemUsageLog {
  id: string;
  teamId: string;
  itemDefinitionId: string;
  playerId: string;
  previousValue: number;
  newValue: number;
  usedAt: string;
  team?: Team;
  itemDefinition?: ItemDefinition;
  player?: Player;
}

// DTOs
export interface CreateItemDefinitionDto {
  name: string;
  description?: string;
  effectType: ItemEffectType;
  effectValue: number;
  price: number;
}

export interface UpdateItemDefinitionDto {
  name?: string;
  description?: string;
  effectType?: ItemEffectType;
  effectValue?: number;
  price?: number;
  isActive?: boolean;
}

export interface BuyItemDto {
  itemDefinitionId: string;
  quantity: number;
}

export interface UseItemDto {
  teamItemId: string;
  playerId: string;
}
