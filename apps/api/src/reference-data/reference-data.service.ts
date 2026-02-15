import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillGroupDto } from './dto/create-skill-group.dto';
import { UpdateSkillGroupDto } from './dto/update-skill-group.dto';
import { CreateSkillDefinitionDto } from './dto/create-skill-definition.dto';
import { UpdateSkillDefinitionDto } from './dto/update-skill-definition.dto';
import { CreatePlayerRoleDefinitionDto } from './dto/create-player-role-definition.dto';
import { UpdatePlayerRoleDefinitionDto } from './dto/update-player-role-definition.dto';
import { CreatePlayStyleDefinitionDto } from './dto/create-play-style-definition.dto';
import { UpdatePlayStyleDefinitionDto } from './dto/update-play-style-definition.dto';
import type { Position } from '../generated/prisma/client';

@Injectable()
export class ReferenceDataService {
  constructor(private prisma: PrismaService) {}

  // ─── Skill Groups ──────────────────────────────────────
  findAllSkillGroups() {
    return this.prisma.skillGroup.findMany({
      include: { skills: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createSkillGroup(dto: CreateSkillGroupDto) {
    return this.prisma.skillGroup.create({ data: dto });
  }

  updateSkillGroup(id: string, dto: UpdateSkillGroupDto) {
    return this.prisma.skillGroup.update({ where: { id }, data: dto });
  }

  deleteSkillGroup(id: string) {
    return this.prisma.skillGroup.delete({ where: { id } });
  }

  // ─── Skill Definitions ────────────────────────────────
  createSkillDefinition(dto: CreateSkillDefinitionDto) {
    return this.prisma.skillDefinition.create({
      data: dto,
      include: { skillGroup: true },
    });
  }

  updateSkillDefinition(id: string, dto: UpdateSkillDefinitionDto) {
    return this.prisma.skillDefinition.update({
      where: { id },
      data: dto,
      include: { skillGroup: true },
    });
  }

  deleteSkillDefinition(id: string) {
    return this.prisma.skillDefinition.delete({ where: { id } });
  }

  // ─── Player Role Definitions ──────────────────────────
  findAllPlayerRoles(position?: Position) {
    return this.prisma.playerRoleDefinition.findMany({
      where: position ? { position } : undefined,
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  createPlayerRole(dto: CreatePlayerRoleDefinitionDto) {
    return this.prisma.playerRoleDefinition.create({ data: dto });
  }

  updatePlayerRole(id: string, dto: UpdatePlayerRoleDefinitionDto) {
    return this.prisma.playerRoleDefinition.update({ where: { id }, data: dto });
  }

  deletePlayerRole(id: string) {
    return this.prisma.playerRoleDefinition.delete({ where: { id } });
  }

  // ─── Play Style Definitions ───────────────────────────
  findAllPlayStyles(position?: Position) {
    return this.prisma.playStyleDefinition.findMany({
      where: position ? { position } : undefined,
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  createPlayStyle(dto: CreatePlayStyleDefinitionDto) {
    return this.prisma.playStyleDefinition.create({ data: dto });
  }

  updatePlayStyle(id: string, dto: UpdatePlayStyleDefinitionDto) {
    return this.prisma.playStyleDefinition.update({ where: { id }, data: dto });
  }

  deletePlayStyle(id: string) {
    return this.prisma.playStyleDefinition.delete({ where: { id } });
  }
}
