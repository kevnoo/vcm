import { Link } from 'react-router';
import { useTeams } from '../../hooks/useTeams';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useTrades } from '../../hooks/useTrades';
import { usePlayers } from '../../hooks/usePlayers';
import type { User, Match } from '@vcm/shared';

export function OwnerDashboard({ user }: { user: User }) {
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: competitions, isLoading: compsLoading } = useCompetitions();

  // Find this owner's team
  const myTeam = teams?.find((t) => t.ownerId === user.id);

  const { data: myPlayers, isLoading: playersLoading } = usePlayers(
    myTeam ? { teamId: myTeam.id } : undefined,
  );

  const { data: myTrades, isLoading: tradesLoading } = useTrades(
    myTeam ? { teamId: myTeam.id } : undefined,
  );

  const activeCompetitions = competitions?.filter((c) => c.status === 'ACTIVE') ?? [];

  // Find competitions my team is in
  const myCompetitions = activeCompetitions.filter((comp) =>
    comp.teams?.some((ct) => ct.teamId === myTeam?.id),
  );

  // Gather all matches involving my team
  const allMyMatches = myCompetitions.flatMap((comp) =>
    (comp.rounds ?? []).flatMap((round) =>
      (round.matches ?? [])
        .filter(
          (m) => m.homeTeamId === myTeam?.id || m.awayTeamId === myTeam?.id,
        )
        .map((m) => ({ ...m, competitionName: comp.name, roundName: round.name })),
    ),
  );

  const upcomingMatches = allMyMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => {
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    })
    .slice(0, 5);

  const recentResults = allMyMatches
    .filter((m) => m.status === 'COMPLETED' && m.result)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Matches that need a result submitted or confirmed
  const pendingResultMatches = allMyMatches.filter(
    (m) =>
      m.status === 'SCHEDULED' ||
      (m.result && m.result.status === 'PENDING' && m.result.submittedById !== user.id),
  );

  // Active trades (pending or pending approval)
  const activeTrades =
    myTrades?.filter(
      (t) => t.status === 'PENDING' || t.status === 'PENDING_APPROVAL' || t.status === 'COUNTERED',
    ) ?? [];

  const isLoading = teamsLoading || compsLoading;

  if (isLoading) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  if (!myTeam) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome, {user.discordUsername}
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            You don't have a team assigned yet.
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            Contact a league admin to get your team set up.
          </p>
        </div>
      </div>
    );
  }

  // Compute record
  const record = recentResults.reduce(
    (acc, m) => {
      if (!m.result) return acc;
      const isHome = m.homeTeamId === myTeam.id;
      const myGoals = isHome ? m.result.homeScore : m.result.awayScore;
      const theirGoals = isHome ? m.result.awayScore : m.result.homeScore;
      if (myGoals > theirGoals) acc.wins++;
      else if (myGoals < theirGoals) acc.losses++;
      else acc.draws++;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0 },
  );

  // Compute overall season record from ALL completed matches, not just recent 5
  const seasonRecord = allMyMatches
    .filter((m) => m.status === 'COMPLETED' && m.result)
    .reduce(
      (acc, m) => {
        if (!m.result) return acc;
        const isHome = m.homeTeamId === myTeam.id;
        const myGoals = isHome ? m.result.homeScore : m.result.awayScore;
        const theirGoals = isHome ? m.result.awayScore : m.result.homeScore;
        if (myGoals > theirGoals) acc.wins++;
        else if (myGoals < theirGoals) acc.losses++;
        else acc.draws++;
        return acc;
      },
      { wins: 0, losses: 0, draws: 0 },
    );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome, {user.discordUsername}
      </h1>

      {/* Team overview card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-4">
          {myTeam.logoUrl ? (
            <img
              src={myTeam.logoUrl}
              alt={myTeam.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
              {myTeam.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <Link
              to={`/teams/${myTeam.id}`}
              className="text-xl font-bold text-gray-900 hover:text-indigo-600"
            >
              {myTeam.name}
            </Link>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
              <span>
                Budget: <strong className="text-gray-900">${myTeam.budget.toLocaleString()}</strong>
              </span>
              <span>
                Roster: <strong className="text-gray-900">{playersLoading ? '...' : (myPlayers?.length ?? 0)}</strong> players
              </span>
              <span>
                Record: <strong className="text-gray-900">
                  {seasonRecord.wins}W - {seasonRecord.draws}D - {seasonRecord.losses}L
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniCard label="Competitions" value={myCompetitions.length} />
        <MiniCard label="Upcoming Matches" value={upcomingMatches.length} />
        <MiniCard
          label="Needs Attention"
          value={pendingResultMatches.length}
          highlight={pendingResultMatches.length > 0}
        />
        <MiniCard
          label="Active Trades"
          value={activeTrades.length}
          highlight={activeTrades.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Upcoming matches */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Upcoming Matches
            </h2>
          </div>
          <div className="p-4">
            {upcomingMatches.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming matches.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((match) => {
                  const isHome = match.homeTeamId === myTeam.id;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  return (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}`}
                      className="block text-sm hover:bg-gray-50 rounded p-1 -m-1"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-500 uppercase">
                            {isHome ? 'Home' : 'Away'}
                          </span>
                          <p className="font-medium text-gray-900">
                            vs {opponent?.name ?? 'TBD'}
                          </p>
                        </div>
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
                  );
                })}
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
            {recentResults.length === 0 ? (
              <p className="text-sm text-gray-500">No results yet.</p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((match) => {
                  const isHome = match.homeTeamId === myTeam.id;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  const myGoals = isHome
                    ? match.result!.homeScore
                    : match.result!.awayScore;
                  const theirGoals = isHome
                    ? match.result!.awayScore
                    : match.result!.homeScore;
                  const resultChar =
                    myGoals > theirGoals ? 'W' : myGoals < theirGoals ? 'L' : 'D';
                  const resultColor =
                    resultChar === 'W'
                      ? 'bg-green-100 text-green-700'
                      : resultChar === 'L'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600';
                  return (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}`}
                      className="block text-sm hover:bg-gray-50 rounded p-1 -m-1"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            vs {opponent?.name ?? 'TBD'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {match.competitionName} &middot; {match.roundName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${resultColor}`}>
                            {resultChar}
                          </span>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {myGoals} - {theirGoals}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active trades */}
      {activeTrades.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Active Trades
            </h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeTrades.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {activeTrades.slice(0, 5).map((trade) => {
              const isInitiator = trade.initiatingTeamId === myTeam.id;
              const otherTeam = isInitiator ? trade.recvTeam : trade.initTeam;
              return (
                <Link
                  key={trade.id}
                  to={`/transfers/trades/${trade.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Trade with {otherTeam?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isInitiator ? 'You initiated' : 'Received offer'} &middot;{' '}
                      {trade.offeredPlayers?.length ?? 0} offered,{' '}
                      {trade.requestedPlayers?.length ?? 0} requested
                    </p>
                  </div>
                  <TradeStatusBadge status={trade.status} />
                </Link>
              );
            })}
          </div>
          <Link
            to="/transfers"
            className="block px-4 py-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium border-t border-gray-100"
          >
            View all transfers &rarr;
          </Link>
        </div>
      )}

      {/* My competitions */}
      {myCompetitions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              My Competitions
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {myCompetitions.map((comp) => {
              const myMatches = (comp.rounds ?? []).flatMap((r) =>
                (r.matches ?? []).filter(
                  (m) =>
                    m.homeTeamId === myTeam.id || m.awayTeamId === myTeam.id,
                ),
              );
              const played = myMatches.filter((m) => m.status === 'COMPLETED').length;
              const total = myMatches.length;
              return (
                <Link
                  key={comp.id}
                  to={`/competitions/${comp.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{comp.name}</p>
                    <p className="text-xs text-gray-500">
                      {comp.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {played}/{total}
                    </p>
                    <p className="text-xs text-gray-500">matches played</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</h3>
      <p
        className={`text-3xl font-bold mt-1 ${
          highlight ? 'text-indigo-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TradeStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PENDING_APPROVAL: 'bg-blue-100 text-blue-700',
    COUNTERED: 'bg-purple-100 text-purple-700',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PENDING_APPROVAL: 'Awaiting Approval',
    COUNTERED: 'Countered',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}
