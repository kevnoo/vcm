import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TRANSACTION_INCLUDE = {
  player: { include: { team: true } },
  fromTeam: true,
  toTeam: true,
  tradeOffer: true,
  waiverWire: true,
  executedBy: true,
} as const;

@Injectable()
export class TransactionHistoryService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { type?: string; teamId?: string; playerId?: string }) {
    return this.prisma.transaction.findMany({
      where: {
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.playerId && { playerId: filters.playerId }),
        ...(filters?.teamId && {
          OR: [
            { fromTeamId: filters.teamId },
            { toTeamId: filters.teamId },
          ],
        }),
      },
      include: TRANSACTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }
}
