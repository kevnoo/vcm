import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeagueSettingsService } from '../league-settings/league-settings.service';
import { CreateTradeOfferDto } from './dto/create-trade-offer.dto';
import { CounterTradeOfferDto } from './dto/counter-trade-offer.dto';
import type { User } from '../generated/prisma/client';

const TRADE_INCLUDE = {
  initTeam: { include: { owner: true } },
  recvTeam: { include: { owner: true } },
  approvedBy: true,
  offeredPlayers: { include: { player: { include: { team: true } } } },
  requestedPlayers: { include: { player: { include: { team: true } } } },
} as const;

@Injectable()
export class TradesService {
  constructor(
    private prisma: PrismaService,
    private leagueSettings: LeagueSettingsService,
  ) {}

  async create(dto: CreateTradeOfferDto, user: User) {
    // Verify the user owns a team (the initiating team)
    const initiatingTeam = await this.prisma.team.findFirst({
      where: { ownerId: user.id },
    });
    if (!initiatingTeam) throw new ForbiddenException('You do not own a team');
    if (initiatingTeam.id === dto.receivingTeamId) {
      throw new BadRequestException('Cannot trade with yourself');
    }

    const expiryDays = await this.leagueSettings.getTradeOfferExpiryDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    return this.prisma.tradeOffer.create({
      data: {
        initiatingTeamId: initiatingTeam.id,
        receivingTeamId: dto.receivingTeamId,
        currencyOffered: dto.currencyOffered ?? 0,
        currencyRequested: dto.currencyRequested ?? 0,
        note: dto.note,
        expiresAt,
        offeredPlayers: dto.offeredPlayerIds?.length
          ? { create: dto.offeredPlayerIds.map((playerId) => ({ playerId })) }
          : undefined,
        requestedPlayers: dto.requestedPlayerIds?.length
          ? { create: dto.requestedPlayerIds.map((playerId) => ({ playerId })) }
          : undefined,
      },
      include: TRADE_INCLUDE,
    });
  }

  findAll(filters?: { status?: string; teamId?: string }) {
    return this.prisma.tradeOffer.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.teamId && {
          OR: [
            { initiatingTeamId: filters.teamId },
            { receivingTeamId: filters.teamId },
          ],
        }),
      },
      include: TRADE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const offer = await this.prisma.tradeOffer.findUnique({
      where: { id },
      include: TRADE_INCLUDE,
    });
    if (!offer) throw new NotFoundException('Trade offer not found');
    return offer;
  }

  findPendingApproval() {
    return this.prisma.tradeOffer.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: TRADE_INCLUDE,
      orderBy: { updatedAt: 'asc' },
    });
  }

  async accept(id: string, user: User, responseNote?: string) {
    const offer = await this.findById(id);
    if (offer.status !== 'PENDING') throw new BadRequestException('Offer is not pending');

    const recvTeam = await this.prisma.team.findUniqueOrThrow({ where: { id: offer.receivingTeamId } });
    if (recvTeam.ownerId !== user.id) throw new ForbiddenException('Only the receiving team owner can accept');

    return this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL', responseNote, respondedAt: new Date() },
      include: TRADE_INCLUDE,
    });
  }

  async reject(id: string, user: User, responseNote?: string) {
    const offer = await this.findById(id);
    if (offer.status !== 'PENDING') throw new BadRequestException('Offer is not pending');

    const recvTeam = await this.prisma.team.findUniqueOrThrow({ where: { id: offer.receivingTeamId } });
    if (recvTeam.ownerId !== user.id) throw new ForbiddenException('Only the receiving team owner can reject');

    return this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'REJECTED', responseNote, respondedAt: new Date() },
      include: TRADE_INCLUDE,
    });
  }

  async counter(id: string, dto: CounterTradeOfferDto, user: User) {
    const offer = await this.findById(id);
    if (offer.status !== 'PENDING') throw new BadRequestException('Offer is not pending');

    const recvTeam = await this.prisma.team.findUniqueOrThrow({ where: { id: offer.receivingTeamId } });
    if (recvTeam.ownerId !== user.id) throw new ForbiddenException('Only the receiving team owner can counter');

    const expiryDays = await this.leagueSettings.getTradeOfferExpiryDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Mark original as countered and create new offer (roles are swapped in counter)
    return this.prisma.$transaction(async (tx) => {
      await tx.tradeOffer.update({
        where: { id },
        data: { status: 'COUNTERED', respondedAt: new Date() },
      });

      return tx.tradeOffer.create({
        data: {
          initiatingTeamId: offer.receivingTeamId,
          receivingTeamId: offer.initiatingTeamId,
          currencyOffered: dto.currencyOffered ?? 0,
          currencyRequested: dto.currencyRequested ?? 0,
          note: dto.note,
          parentOfferId: id,
          expiresAt,
          offeredPlayers: dto.offeredPlayerIds?.length
            ? { create: dto.offeredPlayerIds.map((playerId) => ({ playerId })) }
            : undefined,
          requestedPlayers: dto.requestedPlayerIds?.length
            ? { create: dto.requestedPlayerIds.map((playerId) => ({ playerId })) }
            : undefined,
        },
        include: TRADE_INCLUDE,
      });
    });
  }

  async cancel(id: string, user: User) {
    const offer = await this.findById(id);
    if (offer.status !== 'PENDING') throw new BadRequestException('Only pending offers can be cancelled');

    const initTeam = await this.prisma.team.findUniqueOrThrow({ where: { id: offer.initiatingTeamId } });
    if (initTeam.ownerId !== user.id) throw new ForbiddenException('Only the initiating team owner can cancel');

    return this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: TRADE_INCLUDE,
    });
  }

  async approve(id: string, user: User, adminNote?: string) {
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.tradeOffer.findUniqueOrThrow({
        where: { id },
        include: {
          offeredPlayers: true,
          requestedPlayers: true,
        },
      });

      if (offer.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException('Trade is not pending approval');
      }

      // Verify all offered players still belong to initiating team
      for (const tp of offer.offeredPlayers) {
        const player = await tx.player.findUniqueOrThrow({ where: { id: tp.playerId } });
        if (player.teamId !== offer.initiatingTeamId) {
          throw new BadRequestException(`Player ${tp.playerId} no longer belongs to the initiating team`);
        }
      }

      // Verify all requested players still belong to receiving team
      for (const tp of offer.requestedPlayers) {
        const player = await tx.player.findUniqueOrThrow({ where: { id: tp.playerId } });
        if (player.teamId !== offer.receivingTeamId) {
          throw new BadRequestException(`Player ${tp.playerId} no longer belongs to the receiving team`);
        }
      }

      // Verify budgets
      const initTeam = await tx.team.findUniqueOrThrow({ where: { id: offer.initiatingTeamId } });
      const recvTeam = await tx.team.findUniqueOrThrow({ where: { id: offer.receivingTeamId } });

      if (offer.currencyOffered > 0 && initTeam.budget < offer.currencyOffered) {
        throw new BadRequestException('Initiating team has insufficient budget');
      }
      if (offer.currencyRequested > 0 && recvTeam.budget < offer.currencyRequested) {
        throw new BadRequestException('Receiving team has insufficient budget');
      }

      // Transfer players: offered players go to receiving team
      for (const tp of offer.offeredPlayers) {
        await tx.player.update({
          where: { id: tp.playerId },
          data: { teamId: offer.receivingTeamId },
        });
        await tx.transaction.create({
          data: {
            type: 'TRADE',
            playerId: tp.playerId,
            fromTeamId: offer.initiatingTeamId,
            toTeamId: offer.receivingTeamId,
            tradeOfferId: offer.id,
            executedById: user.id,
          },
        });
      }

      // Transfer players: requested players go to initiating team
      for (const tp of offer.requestedPlayers) {
        await tx.player.update({
          where: { id: tp.playerId },
          data: { teamId: offer.initiatingTeamId },
        });
        await tx.transaction.create({
          data: {
            type: 'TRADE',
            playerId: tp.playerId,
            fromTeamId: offer.receivingTeamId,
            toTeamId: offer.initiatingTeamId,
            tradeOfferId: offer.id,
            executedById: user.id,
          },
        });
      }

      // Transfer currency
      if (offer.currencyOffered > 0) {
        await tx.team.update({
          where: { id: offer.initiatingTeamId },
          data: { budget: { decrement: offer.currencyOffered } },
        });
        await tx.team.update({
          where: { id: offer.receivingTeamId },
          data: { budget: { increment: offer.currencyOffered } },
        });
      }
      if (offer.currencyRequested > 0) {
        await tx.team.update({
          where: { id: offer.receivingTeamId },
          data: { budget: { decrement: offer.currencyRequested } },
        });
        await tx.team.update({
          where: { id: offer.initiatingTeamId },
          data: { budget: { increment: offer.currencyRequested } },
        });
      }

      // Update offer status
      return tx.tradeOffer.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: user.id, adminNote },
        include: TRADE_INCLUDE,
      });
    });
  }

  async deny(id: string, user: User, adminNote?: string) {
    const offer = await this.findById(id);
    if (offer.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Trade is not pending approval');
    }

    return this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'DENIED', approvedById: user.id, adminNote },
      include: TRADE_INCLUDE,
    });
  }
}
