import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useMatchStats, useSaveLineup, useSaveSubstitutions, useSavePlayerStats } from '../../hooks/useGameStats';
import { usePlayers } from '../../hooks/usePlayers';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Match, MatchLineupEntry, MatchSubstitution, MatchPlayerStat } from '@vcm/shared';
import type { Position, MatchStatType } from '@vcm/shared';

const POSITIONS: Position[] = ['GK','RB','CB','LB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'] as Position[];
const STAT_TYPES: MatchStatType[] = ['GOAL','ASSIST','TACKLE','SAVE'] as MatchStatType[];

export function MatchStatsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading: matchLoading } = useQuery<Match>({
    queryKey: ['matches', matchId],
    queryFn: () => api.get(`/matches/${matchId}`).then((r) => r.data),
    enabled: !!matchId,
  });
  const { data: stats, isLoading: statsLoading } = useMatchStats(matchId!);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (matchLoading || statsLoading) return <p className="text-gray-500">Loading...</p>;
  if (!match) return <p className="text-gray-500">Match not found.</p>;

  const canEditHome =
    isAdmin() || user?.id === (match.homeTeam as any)?.owner?.id;
  const canEditAway =
    isAdmin() || user?.id === (match.awayTeam as any)?.owner?.id;

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/competitions/${match.round?.competition?.id ?? ''}`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          &larr; Back to competition
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {match.homeTeam?.name} vs {match.awayTeam?.name}
        </h1>
        {match.result && (
          <p className="text-lg text-gray-600">
            Final Score: {match.result.homeScore} - {match.result.awayScore}
          </p>
        )}
        <p className="text-sm text-gray-500">
          {match.round?.name ?? `Round ${match.round?.roundNumber}`}
          {match.scheduledAt &&
            ` \u00b7 ${new Date(match.scheduledAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineupSection
          title={`${match.homeTeam?.name} Lineup`}
          matchId={matchId!}
          teamId={match.homeTeamId}
          lineup={stats?.homeLineup ?? []}
          substitutions={(stats?.substitutions ?? []).filter(
            (s) => s.teamId === match.homeTeamId,
          )}
          canEdit={canEditHome}
        />
        <LineupSection
          title={`${match.awayTeam?.name} Lineup`}
          matchId={matchId!}
          teamId={match.awayTeamId}
          lineup={stats?.awayLineup ?? []}
          substitutions={(stats?.substitutions ?? []).filter(
            (s) => s.teamId === match.awayTeamId,
          )}
          canEdit={canEditAway}
        />
      </div>

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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {canEdit && !editing && !editingSubs && (
          <div className="flex gap-2">
            <button
              onClick={startEditLineup}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Edit Lineup
            </button>
            <button
              onClick={startEditSubs}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Edit Subs
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div>
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <select
                value={entry.playerId}
                onChange={(e) => updateEntry(i, 'playerId', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1"
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
                className="rounded border border-gray-300 px-2 py-1 text-sm w-20"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={entry.isStarter}
                  onChange={(e) =>
                    updateEntry(i, 'isStarter', e.target.checked)
                  }
                />
                Start
              </label>
              <button
                onClick={() => removeEntry(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                &times;
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button
              onClick={addEntry}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              + Add Player
            </button>
            <button
              onClick={() => {
                saveLineup.mutate(
                  { entries: entries.filter((e) => e.playerId) },
                  { onSuccess: () => setEditing(false) },
                );
              }}
              disabled={saveLineup.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
            >
              Save Lineup
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {starters.length > 0 && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                Starting XI
              </h3>
              <div className="space-y-1">
                {starters.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between text-sm text-gray-800"
                  >
                    <span>
                      {entry.player?.firstName} {entry.player?.lastName}
                    </span>
                    <span className="text-gray-400">{entry.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bench.length > 0 && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                Bench
              </h3>
              <div className="space-y-1">
                {bench.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between text-sm text-gray-600"
                  >
                    <span>
                      {entry.player?.firstName} {entry.player?.lastName}
                    </span>
                    <span className="text-gray-400">{entry.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lineup.length === 0 && (
            <p className="text-sm text-gray-400 italic">No lineup set</p>
          )}
        </div>
      )}

      {/* Substitutions */}
      {editingSubs ? (
        <div className="mt-4 pt-3 border-t">
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Substitutions
          </h3>
          {subs.map((sub, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <select
                value={sub.playerOutId}
                onChange={(e) => updateSub(i, 'playerOutId', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1"
              >
                <option value="">Out...</option>
                {teamPlayers?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <span className="text-gray-400 text-xs">&rarr;</span>
              <select
                value={sub.playerInId}
                onChange={(e) => updateSub(i, 'playerInId', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1"
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
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
                placeholder="Min"
              />
              <button
                onClick={() => removeSub(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                &times;
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button
              onClick={addSub}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              + Add Sub
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
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
            >
              Save Subs
            </button>
            <button
              onClick={() => setEditingSubs(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        substitutions.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Substitutions
            </h3>
            <div className="space-y-1">
              {substitutions.map((sub) => (
                <div key={sub.id} className="text-sm text-gray-700">
                  <span className="text-red-500">
                    {sub.playerOut?.firstName} {sub.playerOut?.lastName}
                  </span>
                  {' '}&rarr;{' '}
                  <span className="text-green-600">
                    {sub.playerIn?.firstName} {sub.playerIn?.lastName}
                  </span>
                  <span className="text-gray-400 ml-2">{sub.minute}&apos;</span>
                </div>
              ))}
            </div>
          </div>
        )
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

  // Group stats by type for display
  const statsByType = STAT_TYPES.reduce(
    (acc, type) => {
      acc[type] = playerStats.filter((s) => s.statType === type);
      return acc;
    },
    {} as Record<string, MatchPlayerStat[]>,
  );

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Player Stats</h2>
        {canEdit && !editing && (
          <button
            onClick={startEdit}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Edit Stats
          </button>
        )}
      </div>

      {editing ? (
        <div>
          {statEntries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <select
                value={entry.playerId}
                onChange={(e) => updateStatEntry(i, 'playerId', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1"
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
                className="rounded border border-gray-300 px-2 py-1 text-sm w-24"
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
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
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
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
                placeholder="Min"
              />
              <button
                onClick={() => removeStatEntry(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                &times;
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button
              onClick={addStatEntry}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              + Add Stat
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
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
            >
              Save Stats
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : playerStats.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_TYPES.map((type) => (
            <div key={type}>
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                {type}s
              </h3>
              {statsByType[type]?.length > 0 ? (
                <div className="space-y-1">
                  {statsByType[type].map((stat) => (
                    <div key={stat.id} className="text-sm text-gray-700">
                      {stat.player?.firstName} {stat.player?.lastName}
                      {stat.value > 1 && (
                        <span className="text-gray-400"> x{stat.value}</span>
                      )}
                      {stat.minute && (
                        <span className="text-gray-400"> {stat.minute}&apos;</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">None</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No stats recorded</p>
      )}
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
    <div className="space-y-1">
      {minutes
        .sort((a, b) => b.minutesPlayed - a.minutesPlayed)
        .map((pm) => {
          const player = playerMap.get(pm.playerId);
          return (
            <div
              key={pm.playerId}
              className="flex justify-between text-sm text-gray-700"
            >
              <span>
                {player?.firstName} {player?.lastName}
              </span>
              <span className="text-gray-500">{pm.minutesPlayed} min</span>
            </div>
          );
        })}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Minutes Played
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {homeMinutes.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Home
            </h3>
            {renderList(homeMinutes)}
          </div>
        )}
        {awayMinutes.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Away
            </h3>
            {renderList(awayMinutes)}
          </div>
        )}
      </div>
    </div>
  );
}
