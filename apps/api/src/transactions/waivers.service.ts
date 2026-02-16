import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeagueSettingsService } from '../league-settings/league-settings.service';
import type { User } from '../generated/prisma/client';

const WAIVER_INCLUDE = {
  player: { include: { team: true } },
  releasedFrom: true,
  bids: { include: { team: true }, orderBy: { amount: 'desc' as const } },
  winningBid: { include: { team: true } },
} as const;

@Injectable()
export class WaiversService {
  constructor(
    private prisma: PrismaService,
    private leagueSettings: LeagueSettingsService,
  ) {}

  async release(playerId: string, user: User) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      include: { team: true },
    });

    if (!player.teamId || !player.team) {
      throw new BadRequestException('Player is not on a team');
    }

    if (player.team.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not own this team');
    }

    const waiverPeriodDays = await this.leagueSettings.getWaiverPeriodDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + waiverPeriodDays);
    const releasedFromId = player.teamId;

    return this.prisma.$transaction(async (tx) => {
      // Remove player from team
      await tx.player.update({ where: { id: playerId }, data: { teamId: null } });

      // Create waiver wire entry
      const waiver = await tx.waiverWire.create({
        data: {
          playerId,
          releasedFromId,
          waiverPeriodDays,
          expiresAt,
        },
        include: WAIVER_INCLUDE,
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          type: 'RELEASED',
          playerId,
          fromTeamId: releasedFromId,
          waiverWireId: waiver.id,
          executedById: user.id,
        },
      });

      return waiver;
    });
  }

  findAll() {
    return this.prisma.waiverWire.findMany({
      where: { status: 'ACTIVE' },
      include: WAIVER_INCLUDE,
      orderBy: { expiresAt: 'asc' },
    });
  }

  async findById(id: string, user: User) {
    const waiver = await this.prisma.waiverWire.findUnique({
      where: { id },
      include: WAIVER_INCLUDE,
    });
    if (!waiver) throw new NotFoundException('Waiver not found');

    // Non-admin owners only see their own bids
    if (user.role !== 'ADMIN') {
      const userTeam = await this.prisma.team.findFirst({ where: { ownerId: user.id } });
      if (userTeam) {
        waiver.bids = waiver.bids.filter((b) => b.teamId === userTeam.id);
      } else {
        waiver.bids = [];
      }
    }

    return waiver;
  }

  async placeBid(waiverWireId: string, amount: number, user: User) {
    const waiver = await this.prisma.waiverWire.findUniqueOrThrow({ where: { id: waiverWireId } });
    if (waiver.status !== 'ACTIVE') throw new BadRequestException('Waiver is not active');
    if (new Date() > waiver.expiresAt) throw new BadRequestException('Waiver period has expired');

    const team = await this.prisma.team.findFirst({ where: { ownerId: user.id } });
    if (!team) throw new ForbiddenException('You do not own a team');

    // Can't bid on your own released player
    if (waiver.releasedFromId === team.id) {
      throw new BadRequestException('Cannot bid on a player you released');
    }

    if (team.budget < amount) {
      throw new BadRequestException(`Insufficient budget. Bid: ${amount}, Available: ${team.budget}`);
    }

    return this.prisma.waiverBid.upsert({
      where: { waiverWireId_teamId: { waiverWireId, teamId: team.id } },
      update: { amount },
      create: { waiverWireId, teamId: team.id, amount },
      include: { team: true },
    });
  }

  async withdrawBid(waiverWireId: string, user: User) {
    const team = await this.prisma.team.findFirst({ where: { ownerId: user.id } });
    if (!team) throw new ForbiddenException('You do not own a team');

    const bid = await this.prisma.waiverBid.findUnique({
      where: { waiverWireId_teamId: { waiverWireId, teamId: team.id } },
    });
    if (!bid) throw new NotFoundException('Bid not found');

    return this.prisma.waiverBid.delete({
      where: { id: bid.id },
    });
  }

  async resolve(id: string, user: User) {
    return this.prisma.$transaction(async (tx) => {
      const waiver = await tx.waiverWire.findUniqueOrThrow({
        where: { id },
        include: { bids: { orderBy: { amount: 'desc' } } },
      });

      if (waiver.status !== 'ACTIVE') throw new BadRequestException('Waiver is not active');

      if (waiver.bids.length > 0) {
        // Highest bid wins
        const winningBid = waiver.bids[0];

        // Verify winner has budget
        const winnerTeam = await tx.team.findUniqueOrThrow({ where: { id: winningBid.teamId } });
        if (winnerTeam.budget < winningBid.amount) {
          throw new BadRequestException('Winning team has insufficient budget');
        }

        // Transfer player, deduct budget
        await tx.player.update({ where: { id: waiver.playerId }, data: { teamId: winningBid.teamId } });
        await tx.team.update({
          where: { id: winningBid.teamId },
          data: { budget: { decrement: winningBid.amount } },
        });

        // Update waiver
        await tx.waiverWire.update({
          where: { id },
          data: { status: 'CLAIMED', winningBidId: winningBid.id },
        });

        // Create transaction
        await tx.transaction.create({
          data: {
            type: 'WAIVER_CLAIM',
            playerId: waiver.playerId,
            toTeamId: winningBid.teamId,
            fromTeamId: waiver.releasedFromId,
            currencyAmount: winningBid.amount,
            waiverWireId: waiver.id,
            executedById: user.id,
          },
        });
      } else {
        // No bids — player stays as free agent
        await tx.waiverWire.update({
          where: { id },
          data: { status: 'CLEARED' },
        });

        await tx.transaction.create({
          data: {
            type: 'WAIVER_CLEAR',
            playerId: waiver.playerId,
            fromTeamId: waiver.releasedFromId,
            waiverWireId: waiver.id,
            executedById: user.id,
          },
        });
      }

      return tx.waiverWire.findUniqueOrThrow({
        where: { id },
        include: WAIVER_INCLUDE,
      });
    });
  }

  async cancel(id: string) {
    const waiver = await this.prisma.waiverWire.findUniqueOrThrow({ where: { id } });
    if (waiver.status !== 'ACTIVE') throw new BadRequestException('Waiver is not active');

    return this.prisma.waiverWire.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: WAIVER_INCLUDE,
    });
  }
}
