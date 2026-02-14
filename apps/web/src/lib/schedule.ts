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

    for (let round = 0; round < roundsPerLeg; round++) {
      const matches: GeneratedMatch[] = [];

      for (let i = 0; i < count / 2; i++) {
        const home = current[i];
        const away = current[count - 1 - i];

        if (home === 'BYE' || away === 'BYE') continue;

        if (leg === 0) {
          matches.push({ home, away });
        } else {
          matches.push({ home: away, away: home });
        }
      }

      const roundNumber = leg * roundsPerLeg + round + 1;
      rounds.push({
        roundNumber,
        name: `Matchday ${roundNumber}`,
        matches,
      });

      // Circle method rotation: fix index 0, rotate the rest
      const last = current.pop()!;
      current.splice(1, 0, last);
    }
  }

  return rounds;
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
