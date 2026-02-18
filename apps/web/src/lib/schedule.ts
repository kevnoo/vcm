export interface GeneratedMatch {
  home: string;
  away: string;
}

export interface GeneratedRound {
  roundNumber: number;
  name: string;
  matches: GeneratedMatch[];
}

/**
 * Generate a round robin schedule using the circle method.
 * Fix team at index 0, rotate the rest.
 * Includes home/away balancing to prevent long consecutive streaks.
 */
export function generateRoundRobin(
  teams: string[],
  legs: number,
): GeneratedRound[] {
  const rotation = [...teams];
  if (rotation.length % 2 !== 0) {
    rotation.push('BYE');
  }

  const count = rotation.length;
  const roundsPerLeg = count - 1;
  const rounds: GeneratedRound[] = [];

  for (let leg = 0; leg < legs; leg++) {
    // Reset rotation for each leg
    const current = [...teams];
    if (current.length % 2 !== 0) {
      current.push('BYE');
    }

    // Generate unordered pairings first (who plays whom)
    const legPairings: [string, string][][] = [];

    for (let round = 0; round < roundsPerLeg; round++) {
      const pairings: [string, string][] = [];

      for (let i = 0; i < count / 2; i++) {
        const teamA = current[i];
        const teamB = current[count - 1 - i];

        if (teamA === 'BYE' || teamB === 'BYE') continue;

        pairings.push([teamA, teamB]);
      }

      legPairings.push(pairings);

      // Circle method rotation: fix index 0, rotate the rest
      const last = current.pop()!;
      current.splice(1, 0, last);
    }

    // Balance home/away assignments to avoid long streaks
    const balanced = balanceHomeAway(legPairings, leg === 1);

    for (let round = 0; round < balanced.length; round++) {
      const roundNumber = leg * roundsPerLeg + round + 1;
      rounds.push({
        roundNumber,
        name: `Matchday ${roundNumber}`,
        matches: balanced[round].map(([home, away]) => ({ home, away })),
      });
    }
  }

  return rounds;
}

/**
 * Get the count and type of the most recent consecutive venue streak.
 */
function getConsecutiveCount(venues: string[]): {
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

/**
 * Balance home/away assignments across rounds to avoid long streaks.
 * For each match, decides which team is home based on:
 * 1. Avoiding 3+ consecutive home or away games for any team
 * 2. Keeping overall home/away counts balanced per team
 */
function balanceHomeAway(
  rounds: [string, string][][],
  reverseDefault: boolean,
): [string, string][][] {
  const homeCount: Record<string, number> = {};
  const lastVenues: Record<string, string[]> = {};

  return rounds.map((round) =>
    round.map(([teamA, teamB]) => {
      const aStreak = getConsecutiveCount(lastVenues[teamA] || []);
      const bStreak = getConsecutiveCount(lastVenues[teamB] || []);
      const aHome = homeCount[teamA] || 0;
      const bHome = homeCount[teamB] || 0;

      let home: string;
      let away: string;

      const aConsecHome = aStreak.type === 'H' ? aStreak.count : 0;
      const bConsecHome = bStreak.type === 'H' ? bStreak.count : 0;
      const aConsecAway = aStreak.type === 'A' ? aStreak.count : 0;
      const bConsecAway = bStreak.type === 'A' ? bStreak.count : 0;

      if (aConsecHome >= 2 && bConsecHome < 2) {
        home = teamB;
        away = teamA;
      } else if (bConsecHome >= 2 && aConsecHome < 2) {
        home = teamA;
        away = teamB;
      } else if (aConsecAway >= 2 && bConsecAway < 2) {
        home = teamA;
        away = teamB;
      } else if (bConsecAway >= 2 && aConsecAway < 2) {
        home = teamB;
        away = teamA;
      } else if (aHome !== bHome) {
        // Team with fewer home games gets home
        if (aHome <= bHome) {
          home = teamA;
          away = teamB;
        } else {
          home = teamB;
          away = teamA;
        }
      } else {
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
 * Generate a knockout bracket (Round 1 only, then show progression).
 * Seeding: 1 vs N, 2 vs N-1, etc.
 */
export function generateKnockout(teams: string[]): GeneratedRound[] {
  const n = teams.length;
  const bracketSize = nextPowerOf2(n);
  const numRounds = Math.log2(bracketSize);
  const rounds: GeneratedRound[] = [];

  // Pad with BYE to fill bracket
  const seeded = [...teams];
  while (seeded.length < bracketSize) {
    seeded.push('BYE');
  }

  // Pair: 0 vs last, 1 vs second-last, etc.
  const paired: (string | null)[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    paired.push(seeded[i]);
    paired.push(seeded[bracketSize - 1 - i]);
  }

  // Round 1
  const r1Matches: GeneratedMatch[] = [];
  const r1Winners: string[] = [];
  for (let i = 0; i < paired.length; i += 2) {
    const home = paired[i]!;
    const away = paired[i + 1]!;

    if (home === 'BYE') {
      r1Winners.push(away);
      continue;
    }
    if (away === 'BYE') {
      r1Winners.push(home);
      continue;
    }

    r1Matches.push({ home, away });
    r1Winners.push(`Winner of ${home} vs ${away}`);
  }

  if (r1Matches.length > 0) {
    rounds.push({
      roundNumber: 1,
      name: getRoundName(1, numRounds),
      matches: r1Matches,
    });
  }

  // Subsequent rounds with placeholder names
  let currentWinners = r1Winners;
  let roundNum = r1Matches.length > 0 ? 2 : 1;

  while (currentWinners.length > 1) {
    const matches: GeneratedMatch[] = [];
    const nextWinners: string[] = [];

    for (let i = 0; i < currentWinners.length; i += 2) {
      const home = currentWinners[i];
      const away = currentWinners[i + 1];
      matches.push({ home, away });
      nextWinners.push(`Winner of ${home} vs ${away}`);
    }

    rounds.push({
      roundNumber: roundNum,
      name: getRoundName(roundNum, numRounds),
      matches,
    });

    currentWinners = nextWinners;
    roundNum++;
  }

  return rounds;
}

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function getRoundName(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  switch (fromEnd) {
    case 0:
      return 'Final';
    case 1:
      return 'Semi-Final';
    case 2:
      return 'Quarter-Final';
    default:
      return `Round of ${Math.pow(2, fromEnd + 1)}`;
  }
}
