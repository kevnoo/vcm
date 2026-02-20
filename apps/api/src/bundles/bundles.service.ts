import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { BuyBundleDto } from './dto/buy-bundle.dto';

@Injectable()
export class BundlesService {
  constructor(private prisma: PrismaService) {}

  // ─── Admin: Bundle CRUD ─────────────────────────────────

  findAll() {
    return this.prisma.bundle.findMany({
      include: { items: { include: { itemDefinition: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.bundle.findUniqueOrThrow({
      where: { id },
      include: { items: { include: { itemDefinition: true } } },
    });
  }

  async create(dto: CreateBundleDto) {
    // Verify all item definitions exist
    const itemIds = dto.items.map((i) => i.itemDefinitionId);
    const items = await this.prisma.itemDefinition.findMany({
      where: { id: { in: itemIds } },
    });
    if (items.length !== itemIds.length) {
      throw new BadRequestException('One or more item definitions not found');
    }

    return this.prisma.bundle.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        items: {
          create: dto.items.map((i) => ({
            itemDefinitionId: i.itemDefinitionId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: { include: { itemDefinition: true } } },
    });
  }

  async update(id: string, dto: UpdateBundleDto) {
    const { items, ...data } = dto;

    if (items) {
      // Verify all item definitions exist
      const itemIds = items.map((i) => i.itemDefinitionId);
      const found = await this.prisma.itemDefinition.findMany({
        where: { id: { in: itemIds } },
      });
      if (found.length !== itemIds.length) {
        throw new BadRequestException('One or more item definitions not found');
      }

      // Replace all bundle items
      return this.prisma.$transaction(async (tx) => {
        await tx.bundleItem.deleteMany({ where: { bundleId: id } });
        return tx.bundle.update({
          where: { id },
          data: {
            ...data,
            items: {
              create: items.map((i) => ({
                itemDefinitionId: i.itemDefinitionId,
                quantity: i.quantity,
              })),
            },
          },
          include: { items: { include: { itemDefinition: true } } },
        });
      });
    }

    return this.prisma.bundle.update({
      where: { id },
      data,
      include: { items: { include: { itemDefinition: true } } },
    });
  }

  delete(id: string) {
    return this.prisma.bundle.delete({ where: { id } });
  }

  // ─── Shop: Active bundles ───────────────────────────────

  findActive() {
    return this.prisma.bundle.findMany({
      where: { isActive: true },
      include: { items: { include: { itemDefinition: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Buy Bundle ─────────────────────────────────────────

  async buyBundle(teamId: string, userId: string, dto: BuyBundleDto) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only the team owner can buy bundles');
    }

    const bundle = await this.prisma.bundle.findUniqueOrThrow({
      where: { id: dto.bundleId },
      include: { items: true },
    });

    if (!bundle.isActive) {
      throw new BadRequestException('This bundle is not available for purchase');
    }

    const totalCost = bundle.price * dto.quantity;
    if (team.budget < totalCost) {
      throw new BadRequestException(
        `Insufficient budget. Need ${totalCost}, have ${team.budget}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct budget
      await tx.team.update({
        where: { id: teamId },
        data: { budget: { decrement: totalCost } },
      });

      // Add each item in the bundle to the team's inventory
      for (const bundleItem of bundle.items) {
        await tx.teamItem.upsert({
          where: {
            teamId_itemDefinitionId: {
              teamId,
              itemDefinitionId: bundleItem.itemDefinitionId,
            },
          },
          create: {
            teamId,
            itemDefinitionId: bundleItem.itemDefinitionId,
            quantity: bundleItem.quantity * dto.quantity,
          },
          update: {
            quantity: { increment: bundleItem.quantity * dto.quantity },
          },
        });
      }

      return { bundle, totalCost, quantityPurchased: dto.quantity };
    });
  }

  // ─── POS: Admin buys on behalf of a team ────────────────

  async posBuyBundle(teamId: string, dto: BuyBundleDto) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    const bundle = await this.prisma.bundle.findUniqueOrThrow({
      where: { id: dto.bundleId },
      include: { items: true },
    });

    if (!bundle.isActive) {
      throw new BadRequestException('This bundle is not available for purchase');
    }

    const totalCost = bundle.price * dto.quantity;
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

      for (const bundleItem of bundle.items) {
        await tx.teamItem.upsert({
          where: {
            teamId_itemDefinitionId: {
              teamId,
              itemDefinitionId: bundleItem.itemDefinitionId,
            },
          },
          create: {
            teamId,
            itemDefinitionId: bundleItem.itemDefinitionId,
            quantity: bundleItem.quantity * dto.quantity,
          },
          update: {
            quantity: { increment: bundleItem.quantity * dto.quantity },
          },
        });
      }

      return { bundle, totalCost, quantityPurchased: dto.quantity };
    });
  }
}
