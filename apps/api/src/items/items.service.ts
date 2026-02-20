import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDefinitionDto } from './dto/create-item-definition.dto';
import { UpdateItemDefinitionDto } from './dto/update-item-definition.dto';
import { BuyItemDto } from './dto/buy-item.dto';
import { UseItemDto } from './dto/use-item.dto';
import { ItemEffectType } from '../generated/prisma/client';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  // ─── Admin: Item Definition CRUD ──────────────────────

  findAllDefinitions() {
    return this.prisma.itemDefinition.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findDefinitionById(id: string) {
    return this.prisma.itemDefinition.findUniqueOrThrow({
      where: { id },
    });
  }

  createDefinition(dto: CreateItemDefinitionDto) {
    return this.prisma.itemDefinition.create({
      data: dto,
    });
  }

  updateDefinition(id: string, dto: UpdateItemDefinitionDto) {
    return this.prisma.itemDefinition.update({
      where: { id },
      data: dto,
    });
  }

  deleteDefinition(id: string) {
    return this.prisma.itemDefinition.delete({ where: { id } });
  }

  // ─── Shop: Active items for purchase ──────────────────

  findActiveDefinitions() {
    return this.prisma.itemDefinition.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Team Inventory ───────────────────────────────────

  findTeamItems(teamId: string) {
    return this.prisma.teamItem.findMany({
      where: { teamId, quantity: { gt: 0 } },
      include: { itemDefinition: true },
      orderBy: { itemDefinition: { name: 'asc' } },
    });
  }

  // ─── Buy Item ─────────────────────────────────────────

  async buyItem(teamId: string, userId: string, dto: BuyItemDto) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only the team owner can buy items');
    }

    const item = await this.prisma.itemDefinition.findUniqueOrThrow({
      where: { id: dto.itemDefinitionId },
    });

    if (!item.isActive) {
      throw new BadRequestException('This item is not available for purchase');
    }

    const totalCost = item.price * dto.quantity;
    if (team.budget < totalCost) {
      throw new BadRequestException(
        `Insufficient budget. Need ${totalCost}, have ${team.budget}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: { budget: { decrement: totalCost } },
      });

      const teamItem = await tx.teamItem.upsert({
        where: {
          teamId_itemDefinitionId: {
            teamId,
            itemDefinitionId: dto.itemDefinitionId,
          },
        },
        create: {
          teamId,
          itemDefinitionId: dto.itemDefinitionId,
          quantity: dto.quantity,
        },
        update: {
          quantity: { increment: dto.quantity },
        },
        include: { itemDefinition: true },
      });

      return teamItem;
    });
  }

  // ─── Use Item ─────────────────────────────────────────

  async useItem(userId: string, dto: UseItemDto) {
    const teamItem = await this.prisma.teamItem.findUniqueOrThrow({
      where: { id: dto.teamItemId },
      include: { itemDefinition: true, team: true },
    });

    if (teamItem.team.ownerId !== userId) {
      throw new ForbiddenException('Only the team owner can use items');
    }

    if (teamItem.quantity <= 0) {
      throw new BadRequestException('No items remaining');
    }

    const player = await this.prisma.player.findUniqueOrThrow({
      where: { id: dto.playerId },
    });

    if (player.teamId !== teamItem.teamId) {
      throw new BadRequestException('Player does not belong to your team');
    }

    const { effectType, effectValue } = teamItem.itemDefinition;
    let previousValue: number;
    let newValue: number;
    const updateData: Record<string, number> = {};

    switch (effectType) {
      case ItemEffectType.BOOST_OVERALL:
        previousValue = player.overall;
        newValue = Math.min(99, player.overall + effectValue);
        updateData.overall = newValue;
        break;
      case ItemEffectType.BOOST_WEAK_FOOT:
        previousValue = player.weakFoot;
        newValue = Math.min(5, player.weakFoot + effectValue);
        if (newValue === previousValue) {
          throw new BadRequestException('Player weak foot is already at maximum (5)');
        }
        updateData.weakFoot = newValue;
        break;
      case ItemEffectType.BOOST_POTENTIAL:
        previousValue = player.potential;
        newValue = Math.min(99, player.potential + effectValue);
        updateData.potential = newValue;
        break;
      case ItemEffectType.SET_OVERALL:
        previousValue = player.overall;
        if (player.overall >= effectValue) {
          throw new BadRequestException(
            `Player overall (${player.overall}) is already at or above ${effectValue}`,
          );
        }
        newValue = effectValue;
        updateData.overall = newValue;
        break;
      default:
        throw new BadRequestException('Unknown item effect type');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.player.update({
        where: { id: dto.playerId },
        data: updateData,
      });

      await tx.teamItem.update({
        where: { id: dto.teamItemId },
        data: { quantity: { decrement: 1 } },
      });

      const log = await tx.itemUsageLog.create({
        data: {
          teamId: teamItem.teamId,
          itemDefinitionId: teamItem.itemDefinitionId,
          playerId: dto.playerId,
          previousValue,
          newValue,
        },
        include: {
          itemDefinition: true,
          player: true,
        },
      });

      return log;
    });
  }

  // ─── Usage History ────────────────────────────────────

  findTeamUsageHistory(teamId: string) {
    return this.prisma.itemUsageLog.findMany({
      where: { teamId },
      include: {
        itemDefinition: true,
        player: true,
      },
      orderBy: { usedAt: 'desc' },
    });
  }
}
