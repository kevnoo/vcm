import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { SetPlayerSkillsDto } from './dto/set-player-skills.dto';
import { AssignPlayerRolesDto } from './dto/assign-player-roles.dto';
import { AssignPlayerPlayStylesDto } from './dto/assign-player-play-styles.dto';
import type { Position } from '../generated/prisma/client';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { teamId?: string; position?: Position; freeAgents?: boolean }) {
    return this.prisma.player.findMany({
      where: {
        ...(filters?.teamId && { teamId: filters.teamId }),
        ...(filters?.position && { primaryPosition: filters.position }),
        ...(filters?.freeAgents && { teamId: null }),
      },
      include: { team: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.player.findUniqueOrThrow({
      where: { id },
      include: {
        team: true,
        skills: {
          include: {
            skillDefinition: { include: { skillGroup: true } },
          },
          orderBy: { skillDefinition: { sortOrder: 'asc' } },
        },
        roles: {
          include: { roleDefinition: true },
          orderBy: { roleDefinition: { sortOrder: 'asc' } },
        },
        playStyles: {
          include: { playStyleDefinition: true },
          orderBy: { playStyleDefinition: { sortOrder: 'asc' } },
        },
      },
    });
  }

  async create(dto: CreatePlayerDto) {
    // Get all skill definitions to auto-populate
    const skillDefinitions = await this.prisma.skillDefinition.findMany();

    const player = await this.prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          age: dto.age,
          primaryPosition: dto.primaryPosition,
          teamId: dto.teamId,
          imageUrl: dto.imageUrl,
        },
      });

      // Auto-populate all skills with default values
      if (skillDefinitions.length > 0) {
        await tx.playerSkill.createMany({
          data: skillDefinitions.map((skill) => ({
            playerId: created.id,
            skillDefinitionId: skill.id,
            value: skill.defaultValue,
          })),
        });
      }

      return created;
    });

    return this.findById(player.id);
  }

  update(id: string, dto: UpdatePlayerDto) {
    return this.prisma.player.update({
      where: { id },
      data: dto,
      include: { team: true },
    });
  }

  delete(id: string) {
    return this.prisma.player.delete({ where: { id } });
  }

  async setSkills(playerId: string, dto: SetPlayerSkillsDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.playerSkill.deleteMany({ where: { playerId } });
      await tx.playerSkill.createMany({
        data: dto.skills.map((s) => ({
          playerId,
          skillDefinitionId: s.skillDefinitionId,
          value: s.value,
        })),
      });
    });

    return this.findById(playerId);
  }

  async assignRoles(playerId: string, dto: AssignPlayerRolesDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.playerRoleAssignment.deleteMany({ where: { playerId } });
      if (dto.roles.length > 0) {
        await tx.playerRoleAssignment.createMany({
          data: dto.roles.map((r) => ({
            playerId,
            playerRoleDefinitionId: r.playerRoleDefinitionId,
            level: r.level,
          })),
        });
      }
    });

    return this.findById(playerId);
  }

  async assignPlayStyles(playerId: string, dto: AssignPlayerPlayStylesDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.playerPlayStyleAssignment.deleteMany({ where: { playerId } });
      if (dto.playStyles.length > 0) {
        await tx.playerPlayStyleAssignment.createMany({
          data: dto.playStyles.map((ps) => ({
            playerId,
            playStyleDefinitionId: ps.playStyleDefinitionId,
            level: ps.level,
          })),
        });
      }
    });

    return this.findById(playerId);
  }
}
