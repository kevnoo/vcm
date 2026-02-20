import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  findByCompetition(competitionId: string) {
    return this.prisma.round.findMany({
      where: { competitionId },
      include: {
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            result: { include: { submittedBy: true } },
          },
          orderBy: { matchNumber: 'asc' },
        },
      },
      orderBy: { roundNumber: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.match.findUniqueOrThrow({
      where: { id },
      include: {
        homeTeam: { include: { owner: true } },
        awayTeam: { include: { owner: true } },
        result: {
          include: {
            submittedBy: true,
            disputedBy: true,
            resolvedBy: true,
          },
        },
        round: { include: { competition: true } },
      },
    });
  }

  async update(id: string, dto: UpdateMatchDto) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id },
      include: { result: true, round: { include: { competition: true } } },
    });

    if (match.status === 'COMPLETED' || match.result) {
      throw new BadRequestException(
        'Cannot edit a match that already has a result',
      );
    }

    const data: Record<string, unknown> = {};

    if (dto.homeTeamId !== undefined) data.homeTeamId = dto.homeTeamId;
    if (dto.awayTeamId !== undefined) data.awayTeamId = dto.awayTeamId;
    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }

    await this.prisma.match.update({ where: { id }, data });

    return this.findById(id);
  }
}
