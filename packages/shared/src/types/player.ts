import { Position, RoleLevel, PlayStyleLevel } from '../enums';
import { Team } from './team';
import type { PlayerValueBreakdown } from './transaction';

export interface SkillGroup {
  id: string;
  name: string;
  sortOrder: number;
  skills?: SkillDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  skillGroupId: string;
  defaultValue: number;
  sortOrder: number;
  skillGroup?: SkillGroup;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerRoleDefinition {
  id: string;
  name: string;
  position: Position;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayStyleDefinition {
  id: string;
  name: string;
  position: Position;
  iconUrl: string | null;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  primaryPosition: Position;
  teamId: string | null;
  imageUrl: string | null;
  team?: Team | null;
  skills?: PlayerSkill[];
  positions?: PlayerPosition[];
  playStyles?: PlayerPlayStyleAssignment[];
  computedValue?: number;
  valueBreakdown?: PlayerValueBreakdown;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerPosition {
  id: string;
  playerId: string;
  position: Position;
  isPrimary: boolean;
  roles?: PlayerRoleAssignment[];
  createdAt: string;
}

export interface PlayerSkill {
  id: string;
  playerId: string;
  skillDefinitionId: string;
  value: number;
  skillDefinition?: SkillDefinition;
}

export interface PlayerRoleAssignment {
  id: string;
  playerPositionId: string;
  playerRoleDefinitionId: string;
  level: RoleLevel;
  roleDefinition?: PlayerRoleDefinition;
}

export interface PlayerPlayStyleAssignment {
  id: string;
  playerId: string;
  playStyleDefinitionId: string;
  level: PlayStyleLevel;
  playStyleDefinition?: PlayStyleDefinition;
}

// DTOs
export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  age: number;
  primaryPosition: Position;
  alternativePositions?: Position[];
  teamId?: string;
  imageUrl?: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  age?: number;
  primaryPosition?: Position;
  alternativePositions?: Position[];
  teamId?: string | null;
  imageUrl?: string | null;
}

export interface SetPlayerSkillsDto {
  skills: { skillDefinitionId: string; value: number }[];
}

export interface AssignPlayerRolesDto {
  positionRoles: {
    position: Position;
    roles: { playerRoleDefinitionId: string; level: RoleLevel }[];
  }[];
}

export interface SetPlayerPositionsDto {
  alternativePositions: Position[];
}

export interface AssignPlayerPlayStylesDto {
  playStyles: { playStyleDefinitionId: string; level: PlayStyleLevel }[];
}

// Reference data DTOs
export interface CreateSkillGroupDto {
  name: string;
  sortOrder?: number;
}

export interface UpdateSkillGroupDto {
  name?: string;
  sortOrder?: number;
}

export interface CreateSkillDefinitionDto {
  name: string;
  skillGroupId: string;
  defaultValue?: number;
  sortOrder?: number;
}

export interface UpdateSkillDefinitionDto {
  name?: string;
  skillGroupId?: string;
  defaultValue?: number;
  sortOrder?: number;
}

export interface CreatePlayerRoleDefinitionDto {
  name: string;
  position: Position;
  description?: string;
  sortOrder?: number;
}

export interface UpdatePlayerRoleDefinitionDto {
  name?: string;
  position?: Position;
  description?: string;
  sortOrder?: number;
}

export interface CreatePlayStyleDefinitionDto {
  name: string;
  position: Position;
  iconUrl?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdatePlayStyleDefinitionDto {
  name?: string;
  position?: Position;
  iconUrl?: string;
  description?: string;
  sortOrder?: number;
}
