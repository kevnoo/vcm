import { Injectable } from '@nestjs/common';
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
}
