import { User } from './user';

export interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDto {
  name: string;
  logoUrl?: string;
  ownerId: string;
}

export interface UpdateTeamDto {
  name?: string;
  logoUrl?: string;
  ownerId?: string;
}
