import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerValueService } from '../players/player-value.service';
import { LeagueSettingsService } from '../league-settings/league-settings.service';
import type { User } from '../generated/prisma/client';

@Injectable()
export class FreeAgencyService {
  constructor(
    private prisma: PrismaService,
    private playerValue: PlayerValueService,
    private leagueSettings: LeagueSettingsService,
  ) {}

  async findFreeAgents() {
    const players = await this.prisma.player.findMany({
      where: { teamId: null },
      include: {
        skills: {
          include: { skillDefinition: { include: { skillGroup: true } } },
        },
        positions: { include: { roles: true } },
        playStyles: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    // Check which free agents are on active waivers
    const activeWaivers = await this.prisma.waiverWire.findMany({
      where: { status: 'ACTIVE' },
      select: { playerId: true },
    });
    const onWaivers = new Set(activeWaivers.map((w) => w.playerId));

    return players
      .filter((p) => !onWaivers.has(p.id))
      .map((player) => {
        const value = this.playerValue.calculateValue(player);
        return { ...player, computedValue: value.totalValue, valueBreakdown: value };
      });
  }

  async claim(playerId: string, user: User, teamId: string) {
    // Verify the user owns the team
    const team = await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    if (team.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not own this team');
    }

    return this.prisma.$transaction(async (tx) => {
      const player = await tx.player.findUniqueOrThrow({
        where: { id: playerId },
        include: {
          skills: {
            include: { skillDefinition: { include: { skillGroup: true } } },
          },
          positions: { include: { roles: true } },
          playStyles: true,
        },
      });

      if (player.teamId !== null) {
        throw new BadRequestException('Player is not a free agent');
      }

      // Verify player is not on active waivers
      const activeWaiver = await tx.waiverWire.findFirst({
        where: { playerId, status: 'ACTIVE' },
      });
      if (activeWaiver) {
        throw new BadRequestException('Player is currently on waivers');
      }

      // Calculate cost
      const costPercent = await this.leagueSettings.getFreeAgencyCostPercent();
      const value = this.playerValue.calculateValue(player);
      const cost = Math.round(value.totalValue * (costPercent / 100));

      // Verify budget
      const currentTeam = await tx.team.findUniqueOrThrow({ where: { id: teamId } });
      if (currentTeam.budget < cost) {
        throw new BadRequestException(`Insufficient budget. Cost: ${cost}, Available: ${currentTeam.budget}`);
      }

      // Transfer player and deduct budget
      await tx.player.update({ where: { id: playerId }, data: { teamId } });
      await tx.team.update({ where: { id: teamId }, data: { budget: { decrement: cost } } });

      // Create transaction record
      await tx.transaction.create({
        data: {
          type: 'FREE_AGENCY',
          playerId,
          toTeamId: teamId,
          currencyAmount: cost,
          executedById: user.id,
        },
      });

      return { playerId, teamId, cost, playerValue: value.totalValue };
    });
  }

  async adminAdd(playerId: string) {
    // Set player as free agent (remove from team)
    const player = await this.prisma.player.findUniqueOrThrow({ where: { id: playerId } });
    const fromTeamId = player.teamId;

    await this.prisma.$transaction(async (tx) => {
      await tx.player.update({ where: { id: playerId }, data: { teamId: null } });
      await tx.transaction.create({
        data: {
          type: 'ADMIN_RELEASE',
          playerId,
          fromTeamId,
        },
      });
    });

    return { playerId, released: true };
  }

  async adminRemove(playerId: string, teamId: string) {
    // Assign player to a team (admin action)
    await this.prisma.$transaction(async (tx) => {
      await tx.player.update({ where: { id: playerId }, data: { teamId } });
      await tx.transaction.create({
        data: {
          type: 'ADMIN_ASSIGN',
          playerId,
          toTeamId: teamId,
        },
      });
    });

    return { playerId, teamId, assigned: true };
  }
}
