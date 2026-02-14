import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.team.findMany({
      include: { owner: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.team.findUniqueOrThrow({
      where: { id },
      include: { owner: true },
    });
  }

  create(dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: dto,
      include: { owner: true },
    });
  }

  update(id: string, dto: UpdateTeamDto) {
    return this.prisma.team.update({
      where: { id },
      data: dto,
      include: { owner: true },
    });
  }

  delete(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }
}
