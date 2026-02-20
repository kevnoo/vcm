import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PosCheckoutDto } from './dto/pos-checkout.dto';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async checkout(dto: PosCheckoutDto) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: dto.teamId },
    });

    // Calculate total cost for individual items
    let totalCost = 0;
    const itemDetails: { itemDefinitionId: string; quantity: number; unitPrice: number }[] = [];

    if (dto.items.length > 0) {
      const itemIds = dto.items.map((i) => i.itemDefinitionId);
      const itemDefs = await this.prisma.itemDefinition.findMany({
        where: { id: { in: itemIds }, isActive: true },
      });

      const itemMap = new Map(itemDefs.map((d) => [d.id, d]));
      for (const item of dto.items) {
        const def = itemMap.get(item.itemDefinitionId);
        if (!def) {
          throw new BadRequestException(
            `Item ${item.itemDefinitionId} not found or not active`,
          );
        }
        const cost = def.price * item.quantity;
        totalCost += cost;
        itemDetails.push({
          itemDefinitionId: item.itemDefinitionId,
          quantity: item.quantity,
          unitPrice: def.price,
        });
      }
    }

    // Calculate total cost for bundles
    const bundleDetails: { bundleId: string; quantity: number; unitPrice: number; items: { itemDefinitionId: string; quantity: number }[] }[] = [];

    if (dto.bundles.length > 0) {
      const bundleIds = dto.bundles.map((b) => b.bundleId);
      const bundles = await this.prisma.bundle.findMany({
        where: { id: { in: bundleIds }, isActive: true },
        include: { items: true },
      });

      const bundleMap = new Map(bundles.map((b) => [b.id, b]));
      for (const bundle of dto.bundles) {
        const def = bundleMap.get(bundle.bundleId);
        if (!def) {
          throw new BadRequestException(
            `Bundle ${bundle.bundleId} not found or not active`,
          );
        }
        const cost = def.price * bundle.quantity;
        totalCost += cost;
        bundleDetails.push({
          bundleId: bundle.bundleId,
          quantity: bundle.quantity,
          unitPrice: def.price,
          items: def.items.map((i) => ({
            itemDefinitionId: i.itemDefinitionId,
            quantity: i.quantity,
          })),
        });
      }
    }

    if (totalCost === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (team.budget < totalCost) {
      throw new BadRequestException(
        `Insufficient budget. Need ${totalCost}, have ${team.budget}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct budget
      await tx.team.update({
        where: { id: dto.teamId },
        data: { budget: { decrement: totalCost } },
      });

      // Add individual items to team inventory
      for (const item of itemDetails) {
        await tx.teamItem.upsert({
          where: {
            teamId_itemDefinitionId: {
              teamId: dto.teamId,
              itemDefinitionId: item.itemDefinitionId,
            },
          },
          create: {
            teamId: dto.teamId,
            itemDefinitionId: item.itemDefinitionId,
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
          },
        });
      }

      // Add bundle items to team inventory
      for (const bundle of bundleDetails) {
        for (const bundleItem of bundle.items) {
          await tx.teamItem.upsert({
            where: {
              teamId_itemDefinitionId: {
                teamId: dto.teamId,
                itemDefinitionId: bundleItem.itemDefinitionId,
              },
            },
            create: {
              teamId: dto.teamId,
              itemDefinitionId: bundleItem.itemDefinitionId,
              quantity: bundleItem.quantity * bundle.quantity,
            },
            update: {
              quantity: { increment: bundleItem.quantity * bundle.quantity },
            },
          });
        }
      }

      return {
        teamId: dto.teamId,
        totalCost,
        itemsPurchased: itemDetails,
        bundlesPurchased: bundleDetails.map((b) => ({
          bundleId: b.bundleId,
          quantity: b.quantity,
          unitPrice: b.unitPrice,
        })),
        remainingBudget: team.budget - totalCost,
      };
    });
  }
}
