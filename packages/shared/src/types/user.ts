import { Role } from '../enums';

export interface User {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  discordUsername: string;
}
