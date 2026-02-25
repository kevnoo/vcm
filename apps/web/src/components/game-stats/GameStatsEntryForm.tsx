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
  // GK-only
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

function StatField({
  label,
  value,
  onChange,
  type = 'number',
  min = 0,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-center"
      />
    </div>
  );
}

export function GameStatsEntryForm({
  matchId,
  teamId,
  players,
  onSubmitted,
}: GameStatsEntryFormProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStatForm>>(() => {
    const initial: Record<string, PlayerStatForm> = {};
    for (const p of players) {
      initial[p.playerId] = createDefaultStats(p);
    }
    return initial;
  });

  const submitGameStats = useSubmitGameStats(matchId);

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

  const togglePlayer = (playerId: string) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  // Separate starters and subs for display
  const starters = players.filter((p) => p.isStarter);
  const subs = players.filter((p) => !p.isStarter);

  const renderPlayerRow = (p: LineupPlayer) => {
    const isExpanded = expandedPlayer === p.playerId;
    const stats = playerStats[p.playerId];
    const isGK = p.position === 'GK';
    const playerName = p.player
      ? `${p.player.firstName} ${p.player.lastName}`
      : p.playerId;

    return (
      <div key={p.playerId} className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header row */}
        <button
          type="button"
          onClick={() => togglePlayer(p.playerId)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {p.position}
            </span>
            <span className="text-sm font-medium text-gray-900">{playerName}</span>
            {!p.isStarter && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                SUB
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded stat fields */}
        {isExpanded && stats && (
          <div className="px-4 py-4 space-y-4">
            {/* Key stats row */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Key Stats</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <StatField
                  label="Rating (1-10)"
                  value={stats.rating}
                  onChange={(v) => updateStat(p.playerId, 'rating', v)}
                  min={1}
                  max={10}
                  step={0.1}
                />
                <StatField
                  label="Goals"
                  value={stats.goals}
                  onChange={(v) => updateStat(p.playerId, 'goals', v)}
                />
                <StatField
                  label="Assists"
                  value={stats.assists}
                  onChange={(v) => updateStat(p.playerId, 'assists', v)}
                />
                <StatField
                  label="Minutes"
                  value={stats.minutesPlayed}
                  onChange={(v) => updateStat(p.playerId, 'minutesPlayed', v)}
                  max={120}
                />
              </div>
            </div>

            {/* Shooting */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Shooting</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <StatField
                  label="Shots"
                  value={stats.shots}
                  onChange={(v) => updateStat(p.playerId, 'shots', v)}
                />
                <StatField
                  label="Shot Accuracy %"
                  value={stats.shotAccuracy}
                  onChange={(v) => updateStat(p.playerId, 'shotAccuracy', v)}
                  max={100}
                />
              </div>
            </div>

            {/* Passing */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Passing</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <StatField
                  label="Passes"
                  value={stats.passes}
                  onChange={(v) => updateStat(p.playerId, 'passes', v)}
                />
                <StatField
                  label="Pass Accuracy %"
                  value={stats.passAccuracy}
                  onChange={(v) => updateStat(p.playerId, 'passAccuracy', v)}
                  max={100}
                />
              </div>
            </div>

            {/* Dribbling */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Dribbling</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <StatField
                  label="Dribbles"
                  value={stats.dribbles}
                  onChange={(v) => updateStat(p.playerId, 'dribbles', v)}
                />
                <StatField
                  label="Dribble Success %"
                  value={stats.dribbleSuccessRate}
                  onChange={(v) => updateStat(p.playerId, 'dribbleSuccessRate', v)}
                  max={100}
                />
              </div>
            </div>

            {/* Defending */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Defending</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <StatField
                  label="Tackles"
                  value={stats.tackles}
                  onChange={(v) => updateStat(p.playerId, 'tackles', v)}
                />
                <StatField
                  label="Tackle Success %"
                  value={stats.tackleSuccessRate}
                  onChange={(v) => updateStat(p.playerId, 'tackleSuccessRate', v)}
                  max={100}
                />
                <StatField
                  label="Poss. Won"
                  value={stats.possessionsWon}
                  onChange={(v) => updateStat(p.playerId, 'possessionsWon', v)}
                />
                <StatField
                  label="Poss. Lost"
                  value={stats.possessionsLost}
                  onChange={(v) => updateStat(p.playerId, 'possessionsLost', v)}
                />
              </div>
            </div>

            {/* Discipline */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Discipline</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <StatField
                  label="Offsides"
                  value={stats.offsides}
                  onChange={(v) => updateStat(p.playerId, 'offsides', v)}
                />
                <StatField
                  label="Fouls"
                  value={stats.foulsCommitted}
                  onChange={(v) => updateStat(p.playerId, 'foulsCommitted', v)}
                />
                <StatField
                  label="Yellow Cards"
                  value={stats.yellowCards}
                  onChange={(v) => updateStat(p.playerId, 'yellowCards', v)}
                  max={2}
                />
                <StatField
                  label="Red Cards"
                  value={stats.redCards}
                  onChange={(v) => updateStat(p.playerId, 'redCards', v)}
                  max={1}
                />
              </div>
            </div>

            {/* GK-only fields */}
            {isGK && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Goalkeeper Stats
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <StatField
                    label="Shots Against"
                    value={stats.shotsAgainst}
                    onChange={(v) => updateStat(p.playerId, 'shotsAgainst', v)}
                  />
                  <StatField
                    label="Shots on Target"
                    value={stats.shotsOnTarget}
                    onChange={(v) => updateStat(p.playerId, 'shotsOnTarget', v)}
                  />
                  <StatField
                    label="Saves"
                    value={stats.saves}
                    onChange={(v) => updateStat(p.playerId, 'saves', v)}
                  />
                  <StatField
                    label="Goals Conceded"
                    value={stats.goalsConceded}
                    onChange={(v) => updateStat(p.playerId, 'goalsConceded', v)}
                  />
                  <StatField
                    label="Save Success %"
                    value={stats.saveSuccessRate}
                    onChange={(v) => updateStat(p.playerId, 'saveSuccessRate', v)}
                    max={100}
                  />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Clean Sheet</label>
                    <button
                      type="button"
                      onClick={() =>
                        updateStat(p.playerId, 'cleanSheet', !stats.cleanSheet)
                      }
                      className={`w-full rounded border px-2 py-1 text-sm font-medium ${
                        stats.cleanSheet
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-300 text-gray-500'
                      }`}
                    >
                      {stats.cleanSheet ? 'Yes' : 'No'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Enter Game Stats</h3>

      {/* Starters */}
      {starters.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            Starters ({starters.length})
          </p>
          <div className="space-y-2">{starters.map(renderPlayerRow)}</div>
        </div>
      )}

      {/* Substitutes */}
      {subs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            Substitutes ({subs.length})
          </p>
          <div className="space-y-2">{subs.map(renderPlayerRow)}</div>
        </div>
      )}

      {players.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No lineup data found. Please set up the lineup in the Match Stats page first.
        </p>
      )}

      {players.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={handleSubmitAll}
            disabled={submitGameStats.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
          >
            {submitGameStats.isPending ? 'Submitting...' : 'Submit All Stats'}
          </button>
          {submitGameStats.isError && (
            <p className="text-sm text-red-600 mt-2">
              Failed to submit stats. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
