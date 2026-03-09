import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useMatchStats, useSaveLineup, useSaveSubstitutions, useSavePlayerStats } from '../../hooks/useGameStats';
import { useMatchGameStats } from '../../hooks/usePlayerGameStats';
import { GameStatsEntryForm } from '../../components/game-stats/GameStatsEntryForm';
import { GameStatsReview } from '../../components/game-stats/GameStatsReview';
import { usePlayers } from '../../hooks/usePlayers';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Match, MatchLineupEntry, MatchSubstitution, MatchPlayerStat } from '@vcm/shared';
import type { Position, MatchStatType } from '@vcm/shared';

const POSITIONS: Position[] = ['GK','RB','CB','LB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'] as Position[];
const STAT_TYPES: MatchStatType[] = ['GOAL','ASSIST','TACKLE','SAVE'] as MatchStatType[];

type Tab = 'lineup' | 'stats' | 'events';

export function MatchStatsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('lineup');
  const { data: match, isLoading: matchLoading } = useQuery<Match>({
    queryKey: ['matches', matchId],
    queryFn: () => api.get(`/matches/${matchId}`).then((r) => r.data),
    enabled: !!matchId,
  });
  const { data: stats, isLoading: statsLoading } = useMatchStats(matchId!);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (matchLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400 text-sm">Loading match stats...</div>
      </div>
    );
  }
  if (!match) return <p className="text-gray-500">Match not found.</p>;

  const canEditHome =
    isAdmin() || user?.id === (match.homeTeam as any)?.owner?.id;
  const canEditAway =
    isAdmin() || user?.id === (match.awayTeam as any)?.owner?.id;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'lineup', label: 'Lineups', count: (stats?.homeLineup?.length ?? 0) + (stats?.awayLineup?.length ?? 0) },
    { key: 'stats', label: 'Game Stats' },
    { key: 'events', label: 'Match Events', count: stats?.playerStats?.length ?? 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back link */}
      <Link
        to={`/competitions/${match.round?.competition?.id ?? ''}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to competition
      </Link>

      {/* Match Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mb-6 text-white">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 text-center">
          {match.round?.competition?.name && `${match.round.competition.name} · `}
          {match.round?.name ?? `Round ${match.round?.roundNumber}`}
          {match.scheduledAt &&
            ` · ${new Date(match.scheduledAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`}
        </p>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div className="text-right flex-1">
            <p className="text-lg sm:text-xl font-bold truncate">{match.homeTeam?.name}</p>
            <p className="text-xs text-slate-400 mt-1">Home</p>
          </div>
          {match.result ? (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-3xl sm:text-4xl font-black tabular-nums">{match.result.homeScore}</span>
              <span className="text-slate-500 text-xl">-</span>
              <span className="text-3xl sm:text-4xl font-black tabular-nums">{match.result.awayScore}</span>
            </div>
          ) : (
            <div className="shrink-0 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-sm">
              vs
            </div>
          )}
          <div className="text-left flex-1">
            <p className="text-lg sm:text-xl font-bold truncate">{match.awayTeam?.name}</p>
            <p className="text-xs text-slate-400 mt-1">Away</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'lineup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineupSection
            title={match.homeTeam?.name ?? 'Home'}
            matchId={matchId!}
            teamId={match.homeTeamId}
            lineup={stats?.homeLineup ?? []}
            substitutions={(stats?.substitutions ?? []).filter(
              (s) => s.teamId === match.homeTeamId,
            )}
            canEdit={canEditHome}
          />
          <LineupSection
            title={match.awayTeam?.name ?? 'Away'}
            matchId={matchId!}
            teamId={match.awayTeamId}
            lineup={stats?.awayLineup ?? []}
            substitutions={(stats?.substitutions ?? []).filter(
              (s) => s.teamId === match.awayTeamId,
            )}
            canEdit={canEditAway}
          />
        </div>
      )}

      {activeTab === 'stats' && (
        <DetailedGameStatsSection
          matchId={matchId!}
          match={match}
          homeLineup={stats?.homeLineup ?? []}
          awayLineup={stats?.awayLineup ?? []}
          userId={user?.id}
          isAdmin={isAdmin()}
        />
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <PlayerStatsSection
            matchId={matchId!}
            playerStats={stats?.playerStats ?? []}
            homeLineup={stats?.homeLineup ?? []}
            awayLineup={stats?.awayLineup ?? []}
            canEdit={canEditHome || canEditAway}
          />
          <MinutesPlayedSection
            playerMinutes={stats?.playerMinutes ?? []}
            homeLineup={stats?.homeLineup ?? []}
            awayLineup={stats?.awayLineup ?? []}
          />
        </div>
      )}
    </div>
  );
}

function LineupSection({
  title,
  matchId,
  teamId,
  lineup,
  substitutions,
  canEdit,
}: {
  title: string;
  matchId: string;
  teamId: string;
  lineup: MatchLineupEntry[];
  substitutions: MatchSubstitution[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editingSubs, setEditingSubs] = useState(false);
  const { data: teamPlayers } = usePlayers({ teamId });
  const saveLineup = useSaveLineup(matchId, teamId);
  const saveSubs = useSaveSubstitutions(matchId, teamId);

  const [entries, setEntries] = useState<
    { playerId: string; position: Position; isStarter: boolean }[]
  >([]);
  const [subs, setSubs] = useState<
    { playerInId: string; playerOutId: string; minute: number }[]
  >([]);

  const startEditLineup = () => {
    setEntries(
      lineup.length > 0
        ? lineup.map((e) => ({
            playerId: e.playerId,
            position: e.position,
            isStarter: e.isStarter,
          }))
        : [],
    );
    setEditing(true);
  };

  const startEditSubs = () => {
    setSubs(
      substitutions.length > 0
        ? substitutions.map((s) => ({
            playerInId: s.playerInId,
            playerOutId: s.playerOutId,
            minute: s.minute,
          }))
        : [],
    );
    setEditingSubs(true);
  };

  const addEntry = () => {
    setEntries([...entries, { playerId: '', position: 'CM' as Position, isStarter: true }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    setEntries(
      entries.map((e, i) =>
        i === index ? { ...e, [field]: value } : e,
      ),
    );
  };

  const addSub = () => {
    setSubs([...subs, { playerInId: '', playerOutId: '', minute: 46 }]);
  };

  const removeSub = (index: number) => {
    setSubs(subs.filter((_, i) => i !== index));
  };

  const updateSub = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setSubs(
      subs.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    );
  };

  const starters = lineup.filter((e) => e.isStarter);
  const bench = lineup.filter((e) => !e.isStarter);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {canEdit && !editing && !editingSubs && (
          <div className="flex gap-3">
            <button
              onClick={startEditLineup}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Edit Lineup
            </button>
            <button
              onClick={startEditSubs}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Edit Subs
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <div>
            {entries.map((entry, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
                <select
                  value={entry.playerId}
                  onChange={(e) => updateEntry(i, 'playerId', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[140px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select player...</option>
                  {teamPlayers?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
                <select
                  value={entry.position}
                  onChange={(e) => updateEntry(i, 'position', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm w-20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.isStarter}
                    onChange={(e) =>
                      updateEntry(i, 'isStarter', e.target.checked)
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Start
                </label>
                <button
                  onClick={() => removeEntry(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={addEntry}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add Player
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveLineup.mutate(
                    { entries: entries.filter((e) => e.playerId) },
                    { onSuccess: () => setEditing(false) },
                  );
                }}
                disabled={saveLineup.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Save Lineup
              </button>
            </div>
          </div>
        ) : (
          <div>
            {starters.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Starting XI
                </h3>
                <div className="space-y-1.5">
                  {starters.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                          {entry.position}
                        </span>
                        <span className="text-sm text-gray-800">
                          {entry.player?.firstName} {entry.player?.lastName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bench.length > 0 && (
              <div className="mb-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Bench
                </h3>
                <div className="space-y-1.5">
                  {bench.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                          {entry.position}
                        </span>
                        <span className="text-sm text-gray-600">
                          {entry.player?.firstName} {entry.player?.lastName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lineup.length === 0 && (
              <p className="text-sm text-gray-400 italic py-2">No lineup set</p>
            )}
          </div>
        )}

        {/* Substitutions */}
        {editingSubs ? (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Substitutions
            </h3>
            {subs.map((sub, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
                <select
                  value={sub.playerOutId}
                  onChange={(e) => updateSub(i, 'playerOutId', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[120px]"
                >
                  <option value="">Out...</option>
                  {teamPlayers?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <select
                  value={sub.playerInId}
                  onChange={(e) => updateSub(i, 'playerInId', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[120px]"
                >
                  <option value="">In...</option>
                  {teamPlayers?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={sub.minute}
                  onChange={(e) =>
                    updateSub(i, 'minute', parseInt(e.target.value) || 0)
                  }
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                  placeholder="Min"
                />
                <button
                  onClick={() => removeSub(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={addSub}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add Sub
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setEditingSubs(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveSubs.mutate(
                    {
                      substitutions: subs.filter(
                        (s) => s.playerInId && s.playerOutId,
                      ),
                    },
                    { onSuccess: () => setEditingSubs(false) },
                  );
                }}
                disabled={saveSubs.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Save Subs
              </button>
            </div>
          </div>
        ) : (
          substitutions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Substitutions
              </h3>
              <div className="space-y-2">
                {substitutions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-sm">
                    <span className="text-red-500 line-through">
                      {sub.playerOut?.firstName} {sub.playerOut?.lastName}
                    </span>
                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-green-600 font-medium">
                      {sub.playerIn?.firstName} {sub.playerIn?.lastName}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto">{sub.minute}&apos;</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DetailedGameStatsSection({
  matchId,
  match,
  homeLineup,
  awayLineup,
  userId,
  isAdmin,
}: {
  matchId: string;
  match: Match;
  homeLineup: MatchLineupEntry[];
  awayLineup: MatchLineupEntry[];
  userId?: string;
  isAdmin: boolean;
}) {
  const { data: gameStats, isLoading } = useMatchGameStats(matchId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400 text-sm">Loading game stats...</div>
      </div>
    );
  }

  const userTeamId =
    (match.homeTeam?.owner as any)?.id === userId
      ? match.homeTeamId
      : (match.awayTeam?.owner as any)?.id === userId
        ? match.awayTeamId
        : null;

  const homeStats = gameStats?.filter((s) => s.teamId === match.homeTeamId) ?? [];
  const awayStats = gameStats?.filter((s) => s.teamId === match.awayTeamId) ?? [];

  const renderTeamStats = (
    teamId: string,
    teamName: string | undefined,
    teamStats: typeof homeStats,
    lineup: MatchLineupEntry[],
    isUserTeam: boolean,
  ) => {
    const hasStats = teamStats.length > 0;
    const isOpposingOwner = !isAdmin && userTeamId !== null && userTeamId !== teamId;

    if (hasStats) {
      const canConfirm =
        isOpposingOwner && teamStats.some((s) => s.status === 'PENDING');
      const canDispute =
        isOpposingOwner &&
        teamStats.some((s) => s.status === 'PENDING' || s.status === 'CONFIRMED');
      const canEditStats = isAdmin || isUserTeam;

      return (
        <div key={teamId}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{teamName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              teamStats[0]?.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
              teamStats[0]?.status === 'DISPUTED' ? 'bg-red-50 text-red-700' :
              teamStats[0]?.status === 'RESOLVED' ? 'bg-blue-50 text-blue-700' :
              'bg-amber-50 text-amber-700'
            }`}>
              {teamStats[0]?.status}
            </span>
          </div>
          <GameStatsReview
            matchId={matchId}
            stats={teamStats}
            canConfirm={canConfirm}
            canDispute={canDispute}
            canEdit={canEditStats}
          />
        </div>
      );
    }

    if (isUserTeam || isAdmin) {
      const players = lineup.map((entry) => ({
        playerId: entry.playerId,
        position: entry.position,
        isStarter: entry.isStarter,
        player: entry.player
          ? { firstName: entry.player.firstName, lastName: entry.player.lastName }
          : undefined,
      }));

      if (players.length === 0) {
        return (
          <div key={teamId} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">{teamName}</p>
            <p className="text-sm text-gray-400">
              Set up the lineup in the Lineups tab before entering game stats.
            </p>
          </div>
        );
      }

      return (
        <div key={teamId}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{teamName}</h3>
          <GameStatsEntryForm
            matchId={matchId}
            teamId={teamId}
            players={players}
          />
        </div>
      );
    }

    return (
      <div key={teamId} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">{teamName}</p>
        <p className="text-sm text-gray-400">
          Waiting for stats to be submitted.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderTeamStats(
        match.homeTeamId,
        match.homeTeam?.name,
        homeStats,
        homeLineup,
        userTeamId === match.homeTeamId,
      )}
      {renderTeamStats(
        match.awayTeamId,
        match.awayTeam?.name,
        awayStats,
        awayLineup,
        userTeamId === match.awayTeamId,
      )}
    </div>
  );
}

function PlayerStatsSection({
  matchId,
  playerStats,
  homeLineup,
  awayLineup,
  canEdit,
}: {
  matchId: string;
  playerStats: MatchPlayerStat[];
  homeLineup: MatchLineupEntry[];
  awayLineup: MatchLineupEntry[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const saveStats = useSavePlayerStats(matchId);
  const [statEntries, setStatEntries] = useState<
    { playerId: string; statType: MatchStatType; value: number; minute?: number }[]
  >([]);

  const allPlayers = [...homeLineup, ...awayLineup];

  const startEdit = () => {
    setStatEntries(
      playerStats.length > 0
        ? playerStats.map((s) => ({
            playerId: s.playerId,
            statType: s.statType,
            value: s.value,
            minute: s.minute ?? undefined,
          }))
        : [],
    );
    setEditing(true);
  };

  const addStatEntry = () => {
    setStatEntries([
      ...statEntries,
      { playerId: '', statType: 'GOAL' as MatchStatType, value: 1 },
    ]);
  };

  const removeStatEntry = (index: number) => {
    setStatEntries(statEntries.filter((_, i) => i !== index));
  };

  const updateStatEntry = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setStatEntries(
      statEntries.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    );
  };

  const statsByType = STAT_TYPES.reduce(
    (acc, type) => {
      acc[type] = playerStats.filter((s) => s.statType === type);
      return acc;
    },
    {} as Record<string, MatchPlayerStat[]>,
  );

  const statIcons: Record<string, string> = {
    GOAL: 'M12 2L2 19h20L12 2z',
    ASSIST: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    TACKLE: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    SAVE: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-900">Match Events</h2>
        {canEdit && !editing && (
          <button
            onClick={startEdit}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Edit Events
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <div>
            {statEntries.map((entry, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
                <select
                  value={entry.playerId}
                  onChange={(e) => updateStatEntry(i, 'playerId', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[140px]"
                >
                  <option value="">Select player...</option>
                  {allPlayers.map((p) => (
                    <option key={p.playerId} value={p.playerId}>
                      {p.player?.firstName} {p.player?.lastName}
                    </option>
                  ))}
                </select>
                <select
                  value={entry.statType}
                  onChange={(e) => updateStatEntry(i, 'statType', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm w-24"
                >
                  {STAT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={entry.value}
                  onChange={(e) =>
                    updateStatEntry(i, 'value', parseInt(e.target.value) || 0)
                  }
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={entry.minute ?? ''}
                  onChange={(e) =>
                    updateStatEntry(
                      i,
                      'minute',
                      e.target.value ? parseInt(e.target.value) : '',
                    )
                  }
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                  placeholder="Min"
                />
                <button
                  onClick={() => removeStatEntry(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={addStatEntry}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add Event
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveStats.mutate(
                    {
                      stats: statEntries
                        .filter((s) => s.playerId)
                        .map((s) => ({
                          ...s,
                          minute: s.minute || undefined,
                        })),
                    },
                    { onSuccess: () => setEditing(false) },
                  );
                }}
                disabled={saveStats.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Save Events
              </button>
            </div>
          </div>
        ) : playerStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STAT_TYPES.map((type) => (
              <div key={type} className="rounded-lg border border-gray-100 p-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {type}s
                </h3>
                {statsByType[type]?.length > 0 ? (
                  <div className="space-y-1.5">
                    {statsByType[type].map((stat) => (
                      <div key={stat.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {stat.player?.firstName} {stat.player?.lastName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {stat.value > 1 && (
                            <span className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                              x{stat.value}
                            </span>
                          )}
                          {stat.minute && (
                            <span className="text-xs text-gray-400">{stat.minute}&apos;</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 italic">None</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">No events recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MinutesPlayedSection({
  playerMinutes,
  homeLineup,
  awayLineup,
}: {
  playerMinutes: { playerId: string; minutesPlayed: number }[];
  homeLineup: MatchLineupEntry[];
  awayLineup: MatchLineupEntry[];
}) {
  if (playerMinutes.length === 0) return null;

  const allPlayers = [...homeLineup, ...awayLineup];
  const playerMap = new Map(allPlayers.map((p) => [p.playerId, p.player]));

  const homeMinutes = playerMinutes.filter((pm) =>
    homeLineup.some((l) => l.playerId === pm.playerId),
  );
  const awayMinutes = playerMinutes.filter((pm) =>
    awayLineup.some((l) => l.playerId === pm.playerId),
  );

  const renderList = (
    minutes: { playerId: string; minutesPlayed: number }[],
  ) => (
    <div className="space-y-1.5">
      {minutes
        .sort((a, b) => b.minutesPlayed - a.minutesPlayed)
        .map((pm) => {
          const player = playerMap.get(pm.playerId);
          const pct = (pm.minutesPlayed / 90) * 100;
          return (
            <div key={pm.playerId} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 w-36 truncate">
                {player?.firstName} {player?.lastName}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right tabular-nums">
                {pm.minutesPlayed} min
              </span>
            </div>
          );
        })}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-900">Minutes Played</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {homeMinutes.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Home
              </h3>
              {renderList(homeMinutes)}
            </div>
          )}
          {awayMinutes.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Away
              </h3>
              {renderList(awayMinutes)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
