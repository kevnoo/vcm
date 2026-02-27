export function matchLabel(match: {
  matchNumber?: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  round: { name?: string | null; roundNumber: number };
}) {
  const round = match.round.name ?? `MD${match.round.roundNumber}`;
  const num = match.matchNumber != null ? ` #${match.matchNumber}` : '';
  return `${round}${num}: ${match.homeTeam.name} vs ${match.awayTeam.name}`;
}

export function discordTimestamp(date: Date, style: 'f' | 'F' | 'R' | 'd' | 'D' | 't' | 'T' = 'F') {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}
