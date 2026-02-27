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

      // Generate unordered pairings first (who plays whom)
      const legPairings: [string, string][][] = [];

      for (let round = 0; round < roundsPerLeg; round++) {
        const pairings: [string, string][] = [];

        for (let i = 0; i < count / 2; i++) {
          const teamA = rotation[i];
          const teamB = rotation[count - 1 - i];

          // Skip BYE matches
          if (teamA === null || teamB === null) continue;

          pairings.push([teamA, teamB]);
        }

        legPairings.push(pairings);

        // Circle method rotation: fix position 0, rotate the rest
        const last = rotation.pop()!;
        rotation.splice(1, 0, last);
      }

      // Balance home/away assignments to avoid long streaks
      const balanced = this.balanceHomeAway(legPairings, leg === 1);

      for (let round = 0; round < balanced.length; round++) {
        const roundNumber = leg * roundsPerLeg + round + 1;
        allRounds.push({
          roundNumber,
          name: `Matchday ${roundNumber}`,
          pairings: balanced[round],
        });
      }
    }

    // Build team → owner map for snapshot
    const teams = await this.prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, ownerId: true },
    });
    const ownerMap = new Map(teams.map((t) => [t.id, t.ownerId]));

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
            homeOwnerId: ownerMap.get(homeId),
            awayOwnerId: ownerMap.get(awayId),
            matchNumber: idx + 1,
          })),
        });
      }
    }
  }

  /**
   * Balance home/away assignments across rounds to avoid long streaks.
   * For each match, decides which team is home based on:
   * 1. Avoiding 3+ consecutive home or away games for any team
   * 2. Keeping overall home/away counts balanced per team
   */
  private balanceHomeAway(
    rounds: [string, string][][],
    reverseDefault: boolean,
  ): [string, string][][] {
    const homeCount: Record<string, number> = {};
    const lastVenues: Record<string, string[]> = {}; // recent venues: 'H' or 'A'

    return rounds.map((round) =>
      round.map(([teamA, teamB]) => {
        const aStreak = this.getConsecutiveCount(lastVenues[teamA] || []);
        const bStreak = this.getConsecutiveCount(lastVenues[teamB] || []);
        const aHome = homeCount[teamA] || 0;
        const bHome = homeCount[teamB] || 0;

        let home: string;
        let away: string;

        // If one team has 2+ consecutive home games, make them away
        const aConsecHome = aStreak.type === 'H' ? aStreak.count : 0;
        const bConsecHome = bStreak.type === 'H' ? bStreak.count : 0;
        const aConsecAway = aStreak.type === 'A' ? aStreak.count : 0;
        const bConsecAway = bStreak.type === 'A' ? bStreak.count : 0;

        if (aConsecHome >= 2 && bConsecHome < 2) {
          // A has been home too long, make them away
          home = teamB;
          away = teamA;
        } else if (bConsecHome >= 2 && aConsecHome < 2) {
          // B has been home too long, make them away
          home = teamA;
          away = teamB;
        } else if (aConsecAway >= 2 && bConsecAway < 2) {
          // A has been away too long, make them home
          home = teamA;
          away = teamB;
        } else if (bConsecAway >= 2 && aConsecAway < 2) {
          // B has been away too long, make them home
          home = teamB;
          away = teamA;
        } else if (aHome !== bHome) {
          // Break tie by overall balance: team with fewer home games gets home
          if (aHome <= bHome) {
            home = teamA;
            away = teamB;
          } else {
            home = teamB;
            away = teamA;
          }
        } else {
          // Default: use original order (or reversed for leg 2)
          if (reverseDefault) {
            home = teamB;
            away = teamA;
          } else {
            home = teamA;
            away = teamB;
          }
        }

        // Update tracking
        homeCount[home] = (homeCount[home] || 0) + 1;
        if (!lastVenues[home]) lastVenues[home] = [];
        lastVenues[home].push('H');
        if (!lastVenues[away]) lastVenues[away] = [];
        lastVenues[away].push('A');

        return [home, away] as [string, string];
      }),
    );
  }

  /**
   * Get the count and type of the most recent consecutive venue streak.
   */
  private getConsecutiveCount(venues: string[]): {
    type: string;
    count: number;
  } {
    if (venues.length === 0) return { type: '', count: 0 };
    const last = venues[venues.length - 1];
    let count = 0;
    for (let i = venues.length - 1; i >= 0; i--) {
      if (venues[i] === last) count++;
      else break;
    }
    return { type: last, count };
  }
}
