import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { SetPlayerSkillsDto } from './dto/set-player-skills.dto';
import { AssignPlayerRolesDto } from './dto/assign-player-roles.dto';
import { AssignPlayerPlayStylesDto } from './dto/assign-player-play-styles.dto';
import { SetPlayerPositionsDto } from './dto/set-player-positions.dto';
import type { Position } from '../generated/prisma/client';

const POSITION_ROLES_INCLUDE = {
  roles: {
    include: { roleDefinition: true },
    orderBy: { roleDefinition: { sortOrder: 'asc' as const } },
  },
};

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { teamId?: string; position?: Position; freeAgents?: boolean }) {
    return this.prisma.player.findMany({
      where: {
        ...(filters?.teamId && { teamId: filters.teamId }),
        ...(filters?.position && {
          OR: [
            { primaryPosition: filters.position },
            { positions: { some: { position: filters.position } } },
          ],
        }),
        ...(filters?.freeAgents && { teamId: null }),
      },
      include: {
        team: true,
        positions: {
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        },
      },
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
        positions: {
          include: POSITION_ROLES_INCLUDE,
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        },
        playStyles: {
          include: { playStyleDefinition: true },
          orderBy: { playStyleDefinition: { sortOrder: 'asc' } },
        },
      },
    });
  }

  async create(dto: CreatePlayerDto) {
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

      // Create PlayerPosition for primary position
      await tx.playerPosition.create({
        data: {
          playerId: created.id,
          position: dto.primaryPosition,
          isPrimary: true,
        },
      });

      // Create PlayerPositions for alternative positions
      if (dto.alternativePositions?.length) {
        await tx.playerPosition.createMany({
          data: dto.alternativePositions
            .filter((pos) => pos !== dto.primaryPosition)
            .map((pos) => ({
              playerId: created.id,
              position: pos,
              isPrimary: false,
            })),
        });
      }

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

  async update(id: string, dto: UpdatePlayerDto) {
    const { alternativePositions, ...playerData } = dto;

    await this.prisma.$transaction(async (tx) => {
      // Update basic player fields
      await tx.player.update({
        where: { id },
        data: playerData,
      });

      // If primaryPosition changed, update isPrimary flags
      if (dto.primaryPosition) {
        // Ensure a PlayerPosition exists for the new primary
        await tx.playerPosition.upsert({
          where: { playerId_position: { playerId: id, position: dto.primaryPosition } },
          create: { playerId: id, position: dto.primaryPosition, isPrimary: true },
          update: { isPrimary: true },
        });

        // Set all other positions to non-primary
        await tx.playerPosition.updateMany({
          where: { playerId: id, position: { not: dto.primaryPosition } },
          data: { isPrimary: false },
        });
      }

      // If alternativePositions provided, sync them
      if (alternativePositions !== undefined) {
        const player = await tx.player.findUniqueOrThrow({
          where: { id },
          select: { primaryPosition: true },
        });

        const desiredPositions = [
          player.primaryPosition,
          ...alternativePositions.filter((p) => p !== player.primaryPosition),
        ];

        // Delete positions not in the desired set (cascades role assignments)
        await tx.playerPosition.deleteMany({
          where: { playerId: id, position: { notIn: desiredPositions } },
        });

        // Upsert each desired position
        for (const pos of desiredPositions) {
          await tx.playerPosition.upsert({
            where: { playerId_position: { playerId: id, position: pos } },
            create: {
              playerId: id,
              position: pos,
              isPrimary: pos === player.primaryPosition,
            },
            update: {},
          });
        }
      }
    });

    return this.findById(id);
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
      for (const positionRole of dto.positionRoles) {
        // Find the PlayerPosition for this position
        const playerPosition = await tx.playerPosition.findUniqueOrThrow({
          where: {
            playerId_position: { playerId, position: positionRole.position },
          },
        });

        // Clear existing role assignments for this position
        await tx.playerRoleAssignment.deleteMany({
          where: { playerPositionId: playerPosition.id },
        });

        // Create new role assignments
        if (positionRole.roles.length > 0) {
          await tx.playerRoleAssignment.createMany({
            data: positionRole.roles.map((r) => ({
              playerPositionId: playerPosition.id,
              playerRoleDefinitionId: r.playerRoleDefinitionId,
              level: r.level,
            })),
          });
        }
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

  async setPositions(playerId: string, dto: SetPlayerPositionsDto) {
    await this.prisma.$transaction(async (tx) => {
      const player = await tx.player.findUniqueOrThrow({
        where: { id: playerId },
        select: { primaryPosition: true },
      });

      const desiredPositions = [
        player.primaryPosition,
        ...dto.alternativePositions.filter((p) => p !== player.primaryPosition),
      ];

      // Delete positions not in the desired set (cascades role assignments)
      await tx.playerPosition.deleteMany({
        where: { playerId, position: { notIn: desiredPositions } },
      });

      // Upsert each desired position
      for (const pos of desiredPositions) {
        await tx.playerPosition.upsert({
          where: { playerId_position: { playerId, position: pos } },
          create: {
            playerId,
            position: pos,
            isPrimary: pos === player.primaryPosition,
          },
          update: {},
        });
      }
    });

    return this.findById(playerId);
  }
}
