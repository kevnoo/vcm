import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { discordUsername: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: { discordUsername: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { discordUsername: dto.discordUsername },
    });
    if (existing) {
      throw new ConflictException(
        `A user with username "${dto.discordUsername}" already exists`,
      );
    }
    return this.prisma.user.create({
      data: {
        discordId: `placeholder:${randomUUID()}`,
        discordUsername: dto.discordUsername,
        role: 'OWNER',
      },
    });
  }
}
