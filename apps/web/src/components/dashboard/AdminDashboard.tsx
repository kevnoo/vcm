import { Link } from 'react-router';
import { useTeams } from '../../hooks/useTeams';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useDisputes } from '../../hooks/useResults';
import { usePendingTrades } from '../../hooks/useTrades';
import { usePlayers } from '../../hooks/usePlayers';
import type { User } from '@vcm/shared';

export function AdminDashboard({ user }: { user: User }) {
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: competitions, isLoading: compsLoading } = useCompetitions();
  const { data: disputes, isLoading: disputesLoading } = useDisputes();
  const { data: pendingTrades, isLoading: tradesLoading } = usePendingTrades();
  const { data: players, isLoading: playersLoading } = usePlayers();

  const activeCompetitions = competitions?.filter((c) => c.status === 'ACTIVE') ?? [];
  const draftCompetitions = competitions?.filter((c) => c.status === 'DRAFT') ?? [];

  // Gather upcoming matches across all active competitions
  const upcomingMatches = activeCompetitions
    .flatMap((comp) =>
      (comp.rounds ?? []).flatMap((round) =>
        (round.matches ?? [])
          .filter((m) => m.status === 'SCHEDULED')
          .map((m) => ({ ...m, competitionName: comp.name, roundName: round.name })),
      ),
    )
    .sort((a, b) => {
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    })
    .slice(0, 5);

  // Gather recent results across all active competitions
  const recentResults = activeCompetitions
    .flatMap((comp) =>
      (comp.rounds ?? []).flatMap((round) =>
        (round.matches ?? [])
          .filter((m) => m.status === 'COMPLETED' && m.result)
          .map((m) => ({ ...m, competitionName: comp.name, roundName: round.name })),
      ),
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const isLoading = teamsLoading || compsLoading || disputesLoading || tradesLoading || playersLoading;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Admin Dashboard
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Teams"
          value={teamsLoading ? '...' : (teams?.length ?? 0)}
          linkTo="/teams"
        />
        <StatCard
          label="Players"
          value={playersLoading ? '...' : (players?.length ?? 0)}
          linkTo="/players"
        />
        <StatCard
          label="Active Competitions"
          value={compsLoading ? '...' : activeCompetitions.length}
          linkTo="/competitions"
        />
        <StatCard
          label="Draft Competitions"
          value={compsLoading ? '...' : draftCompetitions.length}
          linkTo="/competitions"
          variant="muted"
        />
      </div>

      {/* Action items row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Disputes */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Open Disputes
            </h2>
            {(disputes?.length ?? 0) > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {disputes?.length}
              </span>
            )}
          </div>
          <div className="p-4">
            {disputesLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : disputes?.length === 0 ? (
              <p className="text-sm text-gray-500">No open disputes.</p>
            ) : (
              <div className="space-y-3">
                {disputes?.slice(0, 3).map((result: any) => (
                  <div key={result.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">
                        {result.match?.homeTeam?.name} {result.homeScore} - {result.awayScore} {result.match?.awayTeam?.name}
                      </span>
                      <p className="text-xs text-gray-500">
                        {result.match?.round?.competition?.name}
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                      Disputed
                    </span>
                  </div>
                ))}
              </div>
            )}
            {(disputes?.length ?? 0) > 0 && (
              <Link
                to="/admin/disputes"
                className="block mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all disputes &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Pending trades */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Pending Trade Approvals
            </h2>
            {(pendingTrades?.length ?? 0) > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingTrades?.length}
              </span>
            )}
          </div>
          <div className="p-4">
            {tradesLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : pendingTrades?.length === 0 ? (
              <p className="text-sm text-gray-500">No trades awaiting approval.</p>
            ) : (
              <div className="space-y-3">
                {pendingTrades?.slice(0, 3).map((trade) => (
                  <Link
                    key={trade.id}
                    to={`/transfers/trades/${trade.id}`}
                    className="block text-sm hover:bg-gray-50 rounded p-1 -m-1"
                  >
                    <span className="font-medium text-gray-900">
                      {trade.initTeam?.name ?? 'Unknown'}
                    </span>
                    <span className="text-gray-400 mx-1">&harr;</span>
                    <span className="font-medium text-gray-900">
                      {trade.recvTeam?.name ?? 'Unknown'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {trade.offeredPlayers?.length ?? 0} offered &middot;{' '}
                      {trade.requestedPlayers?.length ?? 0} requested
                    </p>
                  </Link>
                ))}
              </div>
            )}
            {(pendingTrades?.length ?? 0) > 0 && (
              <Link
                to="/admin/pending-trades"
                className="block mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all pending trades &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming matches & Recent results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Upcoming matches */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Upcoming Matches
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : upcomingMatches.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming matches.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="block text-sm hover:bg-gray-50 rounded p-1 -m-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {match.homeTeam?.name} vs {match.awayTeam?.name}
                      </span>
                      {match.scheduledAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(match.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {match.competitionName} &middot; {match.roundName}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Recent Results
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : recentResults.length === 0 ? (
              <p className="text-sm text-gray-500">No recent results.</p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="block text-sm hover:bg-gray-50 rounded p-1 -m-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {match.homeTeam?.name}{' '}
                        <span className="text-gray-700">
                          {match.result?.homeScore} - {match.result?.awayScore}
                        </span>{' '}
                        {match.awayTeam?.name}
                      </span>
                      <ResultStatusBadge status={match.result?.status ?? ''} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {match.competitionName} &middot; {match.roundName}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active competitions */}
      {activeCompetitions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Active Competitions
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeCompetitions.map((comp) => {
              const totalMatches = (comp.rounds ?? []).reduce(
                (acc, r) => acc + (r.matches?.length ?? 0),
                0,
              );
              const completedMatches = (comp.rounds ?? []).reduce(
                (acc, r) =>
                  acc + (r.matches?.filter((m) => m.status === 'COMPLETED').length ?? 0),
                0,
              );
              return (
                <Link
                  key={comp.id}
                  to={`/competitions/${comp.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{comp.name}</p>
                    <p className="text-xs text-gray-500">
                      {comp.type.replace(/_/g, ' ')} &middot; {comp.teams?.length ?? 0} teams
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {completedMatches}/{totalMatches}
                    </p>
                    <p className="text-xs text-gray-500">matches played</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction to="/teams/create" label="Add Team" />
          <QuickAction to="/competitions/create" label="Create Competition" />
          <QuickAction to="/players/create" label="Add Player" />
          <QuickAction to="/admin/league-settings" label="League Settings" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  linkTo,
  variant = 'default',
}: {
  label: string;
  value: number | string;
  linkTo: string;
  variant?: 'default' | 'muted';
}) {
  return (
    <Link
      to={linkTo}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
    >
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</h3>
      <p
        className={`text-3xl font-bold mt-1 ${
          variant === 'muted' ? 'text-gray-400' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function ResultStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    DISPUTED: 'bg-red-100 text-red-700',
    RESOLVED: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {label}
    </Link>
  );
}
