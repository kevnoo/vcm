import { useState, useCallback } from 'react';
import { useSubmitGameStats } from '../../hooks/usePlayerGameStats';
import type { PlayerGameStatEntry } from '@vcm/shared';

interface LineupPlayer {
  playerId: string;
  position: string;
  isStarter: boolean;
  player?: { firstName: string; lastName: string };
}

interface GameStatsEntryFormProps {
  matchId: string;
  teamId: string;
  players: LineupPlayer[];
  onSubmitted?: () => void;
}

interface PlayerStatForm {
  playerId: string;
  position: string;
  isSubstitute: boolean;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  shotAccuracy: number;
  passes: number;
  passAccuracy: number;
  dribbles: number;
  dribbleSuccessRate: number;
  tackles: number;
  tackleSuccessRate: number;
  offsides: number;
  foulsCommitted: number;
  possessionsWon: number;
  possessionsLost: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  shotsAgainst: number;
  shotsOnTarget: number;
  saves: number;
  goalsConceded: number;
  saveSuccessRate: number;
  cleanSheet: boolean;
}

function createDefaultStats(player: LineupPlayer): PlayerStatForm {
  return {
    playerId: player.playerId,
    position: player.position,
    isSubstitute: !player.isStarter,
    rating: 6.0,
    goals: 0,
    assists: 0,
    shots: 0,
    shotAccuracy: 0,
    passes: 0,
    passAccuracy: 0,
    dribbles: 0,
    dribbleSuccessRate: 0,
    tackles: 0,
    tackleSuccessRate: 0,
    offsides: 0,
    foulsCommitted: 0,
    possessionsWon: 0,
    possessionsLost: 0,
    minutesPlayed: player.isStarter ? 90 : 0,
    yellowCards: 0,
    redCards: 0,
    shotsAgainst: 0,
    shotsOnTarget: 0,
    saves: 0,
    goalsConceded: 0,
    saveSuccessRate: 0,
    cleanSheet: false,
  };
}

type StatCategory = 'key' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'discipline' | 'goalkeeper';

const CATEGORIES: { key: StatCategory; label: string; gkOnly?: boolean }[] = [
  { key: 'key', label: 'Key Stats' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'passing', label: 'Passing' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'defending', label: 'Defending' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'goalkeeper', label: 'GK Stats', gkOnly: true },
];

interface StatFieldDef {
  key: keyof PlayerStatForm;
  label: string;
  shortLabel: string;
  min?: number;
  max?: number;
  step?: number;
  type?: 'number' | 'toggle';
}

const CATEGORY_FIELDS: Record<StatCategory, StatFieldDef[]> = {
  key: [
    { key: 'rating', label: 'Rating', shortLabel: 'RTG', min: 1, max: 10, step: 0.1 },
    { key: 'goals', label: 'Goals', shortLabel: 'G' },
    { key: 'assists', label: 'Assists', shortLabel: 'A' },
    { key: 'minutesPlayed', label: 'Minutes', shortLabel: 'MIN', max: 120 },
  ],
  shooting: [
    { key: 'shots', label: 'Shots', shortLabel: 'SH' },
    { key: 'shotAccuracy', label: 'Shot Accuracy %', shortLabel: 'SA%', max: 100 },
  ],
  passing: [
    { key: 'passes', label: 'Passes', shortLabel: 'PAS' },
    { key: 'passAccuracy', label: 'Pass Accuracy %', shortLabel: 'PA%', max: 100 },
  ],
  dribbling: [
    { key: 'dribbles', label: 'Dribbles', shortLabel: 'DRB' },
    { key: 'dribbleSuccessRate', label: 'Dribble Success %', shortLabel: 'DS%', max: 100 },
  ],
  defending: [
    { key: 'tackles', label: 'Tackles', shortLabel: 'TKL' },
    { key: 'tackleSuccessRate', label: 'Tackle Success %', shortLabel: 'TS%', max: 100 },
    { key: 'possessionsWon', label: 'Poss. Won', shortLabel: 'PW' },
    { key: 'possessionsLost', label: 'Poss. Lost', shortLabel: 'PL' },
  ],
  discipline: [
    { key: 'offsides', label: 'Offsides', shortLabel: 'OFF' },
    { key: 'foulsCommitted', label: 'Fouls', shortLabel: 'FLS' },
    { key: 'yellowCards', label: 'Yellow Cards', shortLabel: 'YC', max: 2 },
    { key: 'redCards', label: 'Red Cards', shortLabel: 'RC', max: 1 },
  ],
  goalkeeper: [
    { key: 'shotsAgainst', label: 'Shots Against', shortLabel: 'SHA' },
    { key: 'shotsOnTarget', label: 'Shots on Target', shortLabel: 'SOT' },
    { key: 'saves', label: 'Saves', shortLabel: 'SAV' },
    { key: 'goalsConceded', label: 'Goals Conceded', shortLabel: 'GC' },
    { key: 'saveSuccessRate', label: 'Save Success %', shortLabel: 'SS%', max: 100 },
    { key: 'cleanSheet', label: 'Clean Sheet', shortLabel: 'CS', type: 'toggle' },
  ],
};

export function GameStatsEntryForm({
  matchId,
  teamId,
  players,
  onSubmitted,
}: GameStatsEntryFormProps) {
  const [activeCategory, setActiveCategory] = useState<StatCategory>('key');
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStatForm>>(() => {
    const initial: Record<string, PlayerStatForm> = {};
    for (const p of players) {
      initial[p.playerId] = createDefaultStats(p);
    }
    return initial;
  });

  const submitGameStats = useSubmitGameStats(matchId);

  const hasGK = players.some((p) => p.position === 'GK');
  const visibleCategories = CATEGORIES.filter((c) => !c.gkOnly || hasGK);

  const updateStat = useCallback(
    (playerId: string, field: keyof PlayerStatForm, value: number | boolean) => {
      setPlayerStats((prev) => ({
        ...prev,
        [playerId]: { ...prev[playerId], [field]: value },
      }));
    },
    [],
  );

  const handleSubmitAll = () => {
    const stats: PlayerGameStatEntry[] = players.map((p) => {
      const s = playerStats[p.playerId];
      const isGK = s.position === 'GK';
      return {
        playerId: s.playerId,
        position: s.position as PlayerGameStatEntry['position'],
        isSubstitute: s.isSubstitute,
        rating: s.rating,
        goals: s.goals,
        assists: s.assists,
        shots: s.shots,
        shotAccuracy: s.shotAccuracy,
        passes: s.passes,
        passAccuracy: s.passAccuracy,
        dribbles: s.dribbles,
        dribbleSuccessRate: s.dribbleSuccessRate,
        tackles: s.tackles,
        tackleSuccessRate: s.tackleSuccessRate,
        offsides: s.offsides,
        foulsCommitted: s.foulsCommitted,
        possessionsWon: s.possessionsWon,
        possessionsLost: s.possessionsLost,
        minutesPlayed: s.minutesPlayed,
        yellowCards: s.yellowCards,
        redCards: s.redCards,
        ...(isGK
          ? {
              shotsAgainst: s.shotsAgainst,
              shotsOnTarget: s.shotsOnTarget,
              saves: s.saves,
              goalsConceded: s.goalsConceded,
              saveSuccessRate: s.saveSuccessRate,
              cleanSheet: s.cleanSheet,
            }
          : {}),
      };
    });

    submitGameStats.mutate(
      { teamId, stats },
      {
        onSuccess: () => {
          onSubmitted?.();
        },
      },
    );
  };

  const starters = players.filter((p) => p.isStarter);
  const subs = players.filter((p) => !p.isStarter);
  const fields = CATEGORY_FIELDS[activeCategory];
  const isGKCategory = activeCategory === 'goalkeeper';

  const playersToShow = isGKCategory
    ? players.filter((p) => p.position === 'GK')
    : players;

  const startersToShow = playersToShow.filter((p) => p.isStarter);
  const subsToShow = playersToShow.filter((p) => !p.isStarter);

  // Count how many players have non-default ratings (a rough progress indicator)
  const filledCount = players.filter((p) => {
    const s = playerStats[p.playerId];
    return s && s.rating !== 6.0;
  }).length;

  if (players.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">
          No lineup data found. Please set up the lineup first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with progress */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Enter Game Stats</h3>
          <span className="text-xs text-gray-500">
            {filledCount}/{players.length} players edited
          </span>
        </div>
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(filledCount / players.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-100 overflow-x-auto">
        <div className="flex px-2 min-w-max">
          {visibleCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table-based stat entry */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5 sticky left-0 bg-gray-50 min-w-[160px]">
                Player
              </th>
              {fields.map((field) => (
                <th
                  key={field.key}
                  className="text-center text-xs font-medium text-gray-500 px-2 py-2.5 min-w-[70px]"
                  title={field.label}
                >
                  <span className="hidden sm:inline">{field.label}</span>
                  <span className="sm:hidden">{field.shortLabel}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {startersToShow.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={fields.length + 1}
                    className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50"
                  >
                    Starters
                  </td>
                </tr>
                {startersToShow.map((p) => (
                  <PlayerStatRow
                    key={p.playerId}
                    player={p}
                    stats={playerStats[p.playerId]}
                    fields={fields}
                    updateStat={updateStat}
                  />
                ))}
              </>
            )}
            {subsToShow.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={fields.length + 1}
                    className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50"
                  >
                    Substitutes
                  </td>
                </tr>
                {subsToShow.map((p) => (
                  <PlayerStatRow
                    key={p.playerId}
                    player={p}
                    stats={playerStats[p.playerId]}
                    fields={fields}
                    updateStat={updateStat}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Submit button */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={handleSubmitAll}
          disabled={submitGameStats.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {submitGameStats.isPending ? 'Submitting...' : 'Submit All Stats'}
        </button>
        {submitGameStats.isError && (
          <p className="text-sm text-red-600 mt-2 text-center">
            Failed to submit stats. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerStatRow({
  player,
  stats,
  fields,
  updateStat,
}: {
  player: LineupPlayer;
  stats: PlayerStatForm;
  fields: StatFieldDef[];
  updateStat: (playerId: string, field: keyof PlayerStatForm, value: number | boolean) => void;
}) {
  if (!stats) return null;

  const playerName = player.player
    ? `${player.player.firstName} ${player.player.lastName}`
    : player.playerId;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-2 sticky left-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold shrink-0">
            {player.position}
          </span>
          <span className="text-sm text-gray-800 truncate">{playerName}</span>
          {!player.isStarter && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded shrink-0">
              SUB
            </span>
          )}
        </div>
      </td>
      {fields.map((field) => (
        <td key={field.key} className="px-1 py-2 text-center">
          {field.type === 'toggle' ? (
            <button
              type="button"
              onClick={() =>
                updateStat(
                  player.playerId,
                  field.key,
                  !(stats[field.key] as boolean),
                )
              }
              className={`w-full max-w-[60px] mx-auto rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                stats[field.key]
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              {stats[field.key] ? 'Yes' : 'No'}
            </button>
          ) : (
            <input
              type="number"
              value={stats[field.key] as number}
              onChange={(e) =>
                updateStat(
                  player.playerId,
                  field.key,
                  parseFloat(e.target.value) || 0,
                )
              }
              min={field.min ?? 0}
              max={field.max}
              step={field.step}
              className="w-full max-w-[60px] mx-auto rounded-md border border-gray-200 px-1.5 py-1 text-sm text-center tabular-nums focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          )}
        </td>
      ))}
    </tr>
  );
}
