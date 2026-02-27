import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KnockoutGenerator {
  constructor(private prisma: PrismaService) {}

  async generate(competitionId: string, teamIds: string[]) {
    const n = teamIds.length;
    const bracketSize = this.nextPowerOf2(n);
    const numByes = bracketSize - n;
    const numRounds = Math.log2(bracketSize);

    const roundName = this.getRoundName(numRounds, 1, numRounds);

    // Build team → owner map for snapshot
    const teams = await this.prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, ownerId: true },
    });
    const ownerMap = new Map(teams.map((t) => [t.id, t.ownerId]));

    // Create Round 1 with seeded matchups
    const seeded = this.seedBracket(teamIds, bracketSize);
    const round = await this.prisma.round.create({
      data: {
        competitionId,
        roundNumber: 1,
        name: roundName,
      },
    });

    const pairings: { homeTeamId: string; awayTeamId: string }[] = [];
    for (let i = 0; i < seeded.length; i += 2) {
      const home = seeded[i];
      const away = seeded[i + 1];

      // Both present: real match
      if (home && away) {
        pairings.push({ homeTeamId: home, awayTeamId: away });
      }
      // If one is null, the other gets a BYE (handled during advancement)
    }

    if (pairings.length > 0) {
      await this.prisma.match.createMany({
        data: pairings.map((p, idx) => ({
          roundId: round.id,
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
          homeOwnerId: ownerMap.get(p.homeTeamId),
          awayOwnerId: ownerMap.get(p.awayTeamId),
          matchNumber: idx + 1,
        })),
      });
    }
  }

  /**
   * Advance to the next round once all matches in the current round are completed.
   * Called by the competitions service when all results for a round are confirmed.
   */
  async advanceRound(competitionId: string, currentRoundNumber: number) {
    const currentRound = await this.prisma.round.findFirst({
      where: { competitionId, roundNumber: currentRoundNumber },
      include: {
        matches: {
          include: { result: true },
          orderBy: { matchNumber: 'asc' },
        },
      },
    });

    if (!currentRound) return null;

    // Get winners from completed matches
    const winners: string[] = [];
    for (const match of currentRound.matches) {
      if (!match.result) return null; // Not all matches completed
      if (
        match.result.status !== 'CONFIRMED' &&
        match.result.status !== 'RESOLVED'
      ) {
        return null;
      }

      const winner =
        match.result.homeScore > match.result.awayScore
          ? match.homeTeamId
          : match.awayTeamId;
      winners.push(winner);
    }

    if (winners.length <= 1) return null; // Final already played

    const totalRounds = Math.ceil(Math.log2(winners.length)) + currentRoundNumber;
    const nextRoundNumber = currentRoundNumber + 1;
    const roundName = this.getRoundName(
      totalRounds,
      nextRoundNumber,
      totalRounds,
    );

    const nextRound = await this.prisma.round.create({
      data: {
        competitionId,
        roundNumber: nextRoundNumber,
        name: roundName,
      },
    });

    // Build team → owner map for snapshot
    const winnerTeams = await this.prisma.team.findMany({
      where: { id: { in: winners } },
      select: { id: true, ownerId: true },
    });
    const ownerMap = new Map(winnerTeams.map((t) => [t.id, t.ownerId]));

    const pairings: { homeTeamId: string; awayTeamId: string }[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        pairings.push({
          homeTeamId: winners[i],
          awayTeamId: winners[i + 1],
        });
      }
    }

    if (pairings.length > 0) {
      await this.prisma.match.createMany({
        data: pairings.map((p, idx) => ({
          roundId: nextRound.id,
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
          homeOwnerId: ownerMap.get(p.homeTeamId),
          awayOwnerId: ownerMap.get(p.awayTeamId),
          matchNumber: idx + 1,
        })),
      });
    }

    return nextRound;
  }

  private seedBracket(
    teamIds: string[],
    bracketSize: number,
  ): (string | null)[] {
    // Standard 1 vs N, 2 vs N-1 seeding
    const seeded: (string | null)[] = new Array(bracketSize).fill(null);
    for (let i = 0; i < teamIds.length; i++) {
      seeded[i] = teamIds[i];
    }

    // Pair: index 0 vs last, 1 vs second-last, etc.
    const paired: (string | null)[] = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      paired.push(seeded[i]);
      paired.push(seeded[bracketSize - 1 - i]);
    }

    return paired;
  }

  private nextPowerOf2(n: number): number {
    let power = 1;
    while (power < n) power *= 2;
    return power;
  }

  private getRoundName(
    totalRounds: number,
    currentRound: number,
    maxRound: number,
  ): string {
    const roundsFromEnd = maxRound - currentRound;
    switch (roundsFromEnd) {
      case 0:
        return 'Final';
      case 1:
        return 'Semi-Final';
      case 2:
        return 'Quarter-Final';
      default:
        return `Round of ${Math.pow(2, roundsFromEnd + 1)}`;
    }
  }
}
