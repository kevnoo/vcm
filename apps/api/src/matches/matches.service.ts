import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
