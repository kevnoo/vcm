import { useState } from 'react';
import { Link } from 'react-router';
import { useCompetitions, useCompetitionStandings } from '../hooks/useCompetitions';
import { useCompetitionLeaders } from '../hooks/usePlayerGameStats';
import type { StandingsEntry } from '@vcm/shared';

export function StandingsPage() {
  const { data: competitions, isLoading: loadingCompetitions } = useCompetitions();
  const [selectedId, setSelectedId] = useState<string>('');

  // Auto-select first active/completed league competition
  const leagueCompetitions = competitions?.filter(
    (c) =>
      (c.type === 'DOUBLE_ROUND_ROBIN' || c.type === 'SINGLE_ROUND_ROBIN') &&
      (c.status === 'ACTIVE' || c.status === 'COMPLETED'),
  );

  const activeId = selectedId || leagueCompetitions?.[0]?.id || '';
  const selectedCompetition = competitions?.find((c) => c.id === activeId);

  const { data: standings, isLoading: loadingStandings } =
    useCompetitionStandings(activeId);
  const { data: leaders, isLoading: loadingLeaders } =
    useCompetitionLeaders(activeId);

  if (loadingCompetitions) {
    return <p className="text-[var(--text-secondary)]">Loading...</p>;
  }

  if (!leagueCompetitions?.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Standings
        </h1>
        <p className="text-[var(--text-secondary)]">
          No active league competitions found.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Standings
        </h1>

        {leagueCompetitions.length > 1 && (
          <select
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm w-full sm:w-auto"
          >
            {leagueCompetitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCompetition && (
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {selectedCompetition.type.replace(/_/g, ' ')} &middot;{' '}
          {selectedCompetition.status}
        </p>
      )}

      {/* Standings Table */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          League Table
        </h2>
        {loadingStandings ? (
          <p className="text-[var(--text-secondary)]">Loading standings...</p>
        ) : standings && standings.length > 0 ? (
          <StandingsTable standings={standings} />
        ) : (
          <p className="text-[var(--text-secondary)]">
            No results yet.
          </p>
        )}
      </section>

      {/* League Leaders */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          League Leaders
        </h2>
        {loadingLeaders ? (
          <p className="text-[var(--text-secondary)]">Loading leaders...</p>
        ) : leaders ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LeaderCard
              title="Top Scorers"
              entries={leaders.topScorers}
              statKey="totalGoals"
              statLabel="Goals"
            />
            <LeaderCard
              title="Top Assists"
              entries={leaders.topAssists}
              statKey="totalAssists"
              statLabel="Assists"
            />
            <LeaderCard
              title="Top Rated"
              entries={leaders.topRated}
              statKey="avgRating"
              statLabel="Avg Rating"
            />
            <LeaderCard
              title="Clean Sheets"
              entries={leaders.topCleanSheets}
              statKey="totalCleanSheets"
              statLabel="Clean Sheets"
            />
          </div>
        ) : (
          <p className="text-[var(--text-secondary)]">
            No player stats available yet.
          </p>
        )}
      </section>
    </div>
  );
}

function StandingsTable({ standings }: { standings: StandingsEntry[] }) {
  return (
    <div className="bg-[var(--surface-card)] rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-3 w-8">#</th>
            <th className="text-left px-3 py-3">Team</th>
            <th className="text-center px-2 py-3 w-10">P</th>
            <th className="text-center px-2 py-3 w-10">W</th>
            <th className="text-center px-2 py-3 w-10">D</th>
            <th className="text-center px-2 py-3 w-10">L</th>
            <th className="text-center px-2 py-3 w-10 hidden sm:table-cell">GF</th>
            <th className="text-center px-2 py-3 w-10 hidden sm:table-cell">GA</th>
            <th className="text-center px-2 py-3 w-10">GD</th>
            <th className="text-center px-2 py-3 w-12 font-bold">Pts</th>
            <th className="text-center px-2 py-3 w-28 hidden md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {standings.map((entry, i) => (
            <tr
              key={entry.teamId}
              className="hover:bg-[var(--surface-elevated)] transition-colors"
            >
              <td className="px-3 py-3 text-[var(--text-secondary)] font-medium">
                {i + 1}
              </td>
              <td className="px-3 py-3 font-medium text-[var(--text-primary)]">
                <Link
                  to={`/teams/${entry.teamId}`}
                  className="hover:text-[var(--accent-primary)] transition-colors"
                >
                  {entry.team?.name ?? 'Unknown'}
                </Link>
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)]">
                {entry.played}
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)]">
                {entry.won}
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)]">
                {entry.drawn}
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)]">
                {entry.lost}
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)] hidden sm:table-cell">
                {entry.goalsFor}
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)] hidden sm:table-cell">
                {entry.goalsAgainst}
              </td>
              <td className="text-center px-2 py-3 text-[var(--text-secondary)]">
                {entry.goalDifference > 0
                  ? `+${entry.goalDifference}`
                  : entry.goalDifference}
              </td>
              <td className="text-center px-2 py-3 font-bold text-[var(--text-primary)]">
                {entry.points}
              </td>
              <td className="text-center px-2 py-3 hidden md:table-cell">
                <div className="flex justify-center gap-1">
                  {entry.form.map((result, j) => (
                    <span
                      key={j}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${
                        result === 'W'
                          ? 'bg-green-500'
                          : result === 'D'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaderCard({
  title,
  entries,
  statKey,
  statLabel,
}: {
  title: string;
  entries: any[];
  statKey: string;
  statLabel: string;
}) {
  if (!entries?.length) return null;

  return (
    <div className="bg-[var(--surface-card)] rounded-lg shadow">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {entries.slice(0, 5).map((entry, i) => (
          <div
            key={entry.playerId}
            className="flex items-center justify-between px-4 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-[var(--text-secondary)] w-5 shrink-0">
                {i + 1}.
              </span>
              <div className="min-w-0">
                <Link
                  to={`/players/${entry.playerId}`}
                  className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors truncate block"
                >
                  {entry.player?.firstName} {entry.player?.lastName}
                </Link>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {entry.team?.name}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {entry[statKey]}
              </span>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {statLabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
