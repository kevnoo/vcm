import { Injectable } from '@nestjs/common';
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

  create(dto: { discordUsername: string }) {
    return this.prisma.user.create({
      data: {
        discordId: `placeholder:${randomUUID()}`,
        discordUsername: dto.discordUsername,
        role: 'OWNER',
      },
    });
  }
}
