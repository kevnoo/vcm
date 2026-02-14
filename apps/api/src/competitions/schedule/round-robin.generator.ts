import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoundRobinGenerator {
  constructor(private prisma: PrismaService) {}

  async generate(
    competitionId: string,
    teamIds: string[],
    options: { legs: number },
  ) {
    const ids = [...teamIds];

    // If odd number of teams, add a null placeholder for BYE
    if (ids.length % 2 !== 0) {
      ids.push(null as any);
    }

    const count = ids.length;
    const roundsPerLeg = count - 1;
    const allRounds: {
      roundNumber: number;
      name: string;
      pairings: [string, string][];
    }[] = [];

    for (let leg = 0; leg < options.legs; leg++) {
      // Reset team order for each leg
      const rotation = [...teamIds];
      if (rotation.length % 2 !== 0) {
        rotation.push(null as any);
      }

      for (let round = 0; round < roundsPerLeg; round++) {
        const pairings: [string, string][] = [];

        for (let i = 0; i < count / 2; i++) {
          const home = rotation[i];
          const away = rotation[count - 1 - i];

          // Skip BYE matches
          if (home === null || away === null) continue;

          if (leg === 0) {
            pairings.push([home, away]);
          } else {
            // Reverse home/away for second leg
            pairings.push([away, home]);
          }
        }

        const roundNumber = leg * roundsPerLeg + round + 1;
        allRounds.push({
          roundNumber,
          name: `Matchday ${roundNumber}`,
          pairings,
        });

        // Circle method rotation: fix position 0, rotate the rest
        const last = rotation.pop()!;
        rotation.splice(1, 0, last);
      }
    }

    // Bulk create rounds and matches
    for (const round of allRounds) {
      const createdRound = await this.prisma.round.create({
        data: {
          competitionId,
          roundNumber: round.roundNumber,
          name: round.name,
        },
      });

      if (round.pairings.length > 0) {
        await this.prisma.match.createMany({
          data: round.pairings.map(([homeId, awayId], idx) => ({
            roundId: createdRound.id,
            homeTeamId: homeId,
            awayTeamId: awayId,
            matchNumber: idx + 1,
          })),
        });
      }
    }
  }
}
