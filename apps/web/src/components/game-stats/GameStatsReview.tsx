import { useState } from 'react';
import { useConfirmGameStats, useDisputeStatField, useUpdateGameStats } from '../../hooks/usePlayerGameStats';
import type { MatchPlayerGameStats } from '@vcm/shared';

interface GameStatsReviewProps {
  matchId: string;
  stats: MatchPlayerGameStats[];
  canConfirm: boolean;
  canDispute: boolean;
  canEdit?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  DISPUTED: 'bg-red-50 text-red-700 border-red-200',
  RESOLVED: 'bg-blue-50 text-blue-700 border-blue-200',
};

type ReviewCategory = 'key' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'discipline' | 'goalkeeper';

interface StatFieldDef {
  key: string;
  label: string;
  shortLabel: string;
}

const REVIEW_CATEGORIES: { key: ReviewCategory; label: string; gkOnly?: boolean }[] = [
  { key: 'key', label: 'Key Stats' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'passing', label: 'Passing' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'defending', label: 'Defending' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'goalkeeper', label: 'GK Stats', gkOnly: true },
];

const REVIEW_FIELDS: Record<ReviewCategory, StatFieldDef[]> = {
  key: [
    { key: 'rating', label: 'Rating', shortLabel: 'RTG' },
    { key: 'goals', label: 'Goals', shortLabel: 'G' },
    { key: 'assists', label: 'Assists', shortLabel: 'A' },
    { key: 'minutesPlayed', label: 'Minutes', shortLabel: 'MIN' },
  ],
  shooting: [
    { key: 'shots', label: 'Shots', shortLabel: 'SH' },
    { key: 'shotAccuracy', label: 'Shot Acc %', shortLabel: 'SA%' },
  ],
  passing: [
    { key: 'passes', label: 'Passes', shortLabel: 'PAS' },
    { key: 'passAccuracy', label: 'Pass Acc %', shortLabel: 'PA%' },
  ],
  dribbling: [
    { key: 'dribbles', label: 'Dribbles', shortLabel: 'DRB' },
    { key: 'dribbleSuccessRate', label: 'Dribble %', shortLabel: 'DS%' },
  ],
  defending: [
    { key: 'tackles', label: 'Tackles', shortLabel: 'TKL' },
    { key: 'tackleSuccessRate', label: 'Tackle %', shortLabel: 'TS%' },
    { key: 'possessionsWon', label: 'Poss. Won', shortLabel: 'PW' },
    { key: 'possessionsLost', label: 'Poss. Lost', shortLabel: 'PL' },
  ],
  discipline: [
    { key: 'offsides', label: 'Offsides', shortLabel: 'OFF' },
    { key: 'foulsCommitted', label: 'Fouls', shortLabel: 'FLS' },
    { key: 'yellowCards', label: 'Yellow', shortLabel: 'YC' },
    { key: 'redCards', label: 'Red', shortLabel: 'RC' },
  ],
  goalkeeper: [
    { key: 'shotsAgainst', label: 'Shots Against', shortLabel: 'SHA' },
    { key: 'shotsOnTarget', label: 'On Target', shortLabel: 'SOT' },
    { key: 'saves', label: 'Saves', shortLabel: 'SAV' },
    { key: 'goalsConceded', label: 'Conceded', shortLabel: 'GC' },
    { key: 'saveSuccessRate', label: 'Save %', shortLabel: 'SS%' },
    { key: 'cleanSheet', label: 'Clean Sheet', shortLabel: 'CS' },
  ],
};

export function GameStatsReview({
  matchId,
  stats,
  canConfirm,
  canDispute,
  canEdit = false,
}: GameStatsReviewProps) {
  const [activeCategory, setActiveCategory] = useState<ReviewCategory>('key');
  const [disputeTarget, setDisputeTarget] = useState<{ statId: string; field: string } | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [editingMinutes, setEditingMinutes] = useState<Record<string, number>>({});

  const confirmGameStats = useConfirmGameStats(matchId);
  const disputeStatField = useDisputeStatField();
  const updateGameStats = useUpdateGameStats();

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-400">No game stats submitted yet.</p>
      </div>
    );
  }

  const teamId = stats[0].teamId;
  const hasGK = stats.some((s) => s.position === 'GK');
  const visibleCategories = REVIEW_CATEGORIES.filter((c) => !c.gkOnly || hasGK);

  const fields = REVIEW_FIELDS[activeCategory];
  const isGKCategory = activeCategory === 'goalkeeper';

  const statsToShow = isGKCategory
    ? stats.filter((s) => s.position === 'GK')
    : stats;

  const starters = statsToShow.filter((s) => !s.isSubstitute);
  const subs = statsToShow.filter((s) => s.isSubstitute);

  const getDisputedFields = (stat: MatchPlayerGameStats): Set<string> => {
    const disputed = new Set<string>();
    if (stat.disputes) {
      for (const d of stat.disputes) {
        if (d.status === 'OPEN') {
          disputed.add(d.fieldName);
        }
      }
    }
    return disputed;
  };

  const handleDispute = () => {
    if (!disputeTarget) return;
    disputeStatField.mutate(
      {
        gameStatsId: disputeTarget.statId,
        fields: [{ fieldName: disputeTarget.field, reason: disputeReason || undefined }],
      },
      {
        onSuccess: () => {
          setDisputeTarget(null);
          setDisputeReason('');
        },
      },
    );
  };

  const handleConfirmAll = () => {
    confirmGameStats.mutate({ teamId });
  };

  const saveMinutes = (statId: string) => {
    const minutes = editingMinutes[statId];
    if (minutes === undefined) return;
    updateGameStats.mutate(
      { gameStatsId: statId, minutesPlayed: minutes },
      {
        onSuccess: () => {
          setEditingMinutes((prev) => {
            const next = { ...prev };
            delete next[statId];
            return next;
          });
        },
      },
    );
  };

  const renderStatValue = (stat: MatchPlayerGameStats, field: StatFieldDef) => {
    const disputedFields = getDisputedFields(stat);
    const isDisputed = disputedFields.has(field.key);
    const value = (stat as any)[field.key];

    if (value === null || value === undefined) {
      return <span className="text-gray-300">-</span>;
    }

    // Special handling for minutes editing
    if (field.key === 'minutesPlayed' && canEdit) {
      const isEditing = stat.id in editingMinutes;
      if (isEditing) {
        return (
          <div className="flex items-center gap-1 justify-center">
            <input
              type="number"
              min={0}
              max={120}
              value={editingMinutes[stat.id]}
              onChange={(e) =>
                setEditingMinutes((prev) => ({
                  ...prev,
                  [stat.id]: parseInt(e.target.value) || 0,
                }))
              }
              className="w-14 rounded border border-gray-300 px-1 py-0.5 text-xs text-center"
            />
            <button
              onClick={() => saveMinutes(stat.id)}
              disabled={updateGameStats.isPending}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setEditingMinutes((prev) => {
                  const next = { ...prev };
                  delete next[stat.id];
                  return next;
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      }
      return (
        <button
          onClick={() => setEditingMinutes((prev) => ({ ...prev, [stat.id]: stat.minutesPlayed }))}
          className="group inline-flex items-center gap-1"
        >
          <span className={`text-sm tabular-nums ${isDisputed ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
            {value}
          </span>
          <svg className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      );
    }

    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

    return (
      <div className="inline-flex items-center gap-1">
        <span
          className={`text-sm tabular-nums ${
            isDisputed ? 'text-red-600 font-medium' : 'text-gray-800'
          } ${field.key === 'rating' ? 'font-bold' : ''}`}
        >
          {typeof value === 'number' && field.key === 'rating' ? value.toFixed(1) : displayValue}
        </span>
        {isDisputed && (
          <svg className="w-3 h-3 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L1 21h22L12 2zm0 3.83L19.53 19H4.47L12 5.83zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z" />
          </svg>
        )}
        {canDispute && !isDisputed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDisputeTarget({ statId: stat.id, field: field.key });
            }}
            className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
            title="Dispute this stat"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-4l13-13a1.5 1.5 0 012.12 0l1.88 1.88a1.5 1.5 0 010 2.12L7 21H3z"
              />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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

      {/* Table view */}
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
                  className="text-center text-xs font-medium text-gray-500 px-3 py-2.5 min-w-[70px]"
                  title={field.label}
                >
                  <span className="hidden sm:inline">{field.label}</span>
                  <span className="sm:hidden">{field.shortLabel}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starters.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={fields.length + 1}
                    className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50/50"
                  >
                    Starters ({starters.length})
                  </td>
                </tr>
                {starters.map((stat) => {
                  const playerName = stat.player
                    ? `${stat.player.firstName} ${stat.player.lastName}`
                    : stat.playerId;
                  const disputedFields = getDisputedFields(stat);
                  const hasAnyDispute = disputedFields.size > 0;
                  return (
                    <tr
                      key={stat.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group/row"
                    >
                      <td className="px-4 py-2.5 sticky left-0 bg-white">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold shrink-0">
                            {stat.position}
                          </span>
                          <span className="text-sm text-gray-800 truncate">{playerName}</span>
                          {hasAnyDispute && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Has disputed stats" />
                          )}
                        </div>
                      </td>
                      {fields.map((field) => (
                        <td key={field.key} className="px-3 py-2.5 text-center">
                          {renderStatValue(stat, field)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            )}
            {subs.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={fields.length + 1}
                    className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50/50"
                  >
                    Substitutes ({subs.length})
                  </td>
                </tr>
                {subs.map((stat) => {
                  const playerName = stat.player
                    ? `${stat.player.firstName} ${stat.player.lastName}`
                    : stat.playerId;
                  const disputedFields = getDisputedFields(stat);
                  const hasAnyDispute = disputedFields.size > 0;
                  return (
                    <tr
                      key={stat.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group/row"
                    >
                      <td className="px-4 py-2.5 sticky left-0 bg-white">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold shrink-0">
                            {stat.position}
                          </span>
                          <span className="text-sm text-gray-600 truncate">{playerName}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded shrink-0">
                            SUB
                          </span>
                          {hasAnyDispute && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Has disputed stats" />
                          )}
                        </div>
                      </td>
                      {fields.map((field) => (
                        <td key={field.key} className="px-3 py-2.5 text-center">
                          {renderStatValue(stat, field)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Dispute input overlay */}
      {disputeTarget && (
        <div className="px-5 py-3 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Reason for dispute (optional)"
              className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleDispute}
              disabled={disputeStatField.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Flag
            </button>
            <button
              onClick={() => {
                setDisputeTarget(null);
                setDisputeReason('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm button */}
      {canConfirm && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleConfirmAll}
            disabled={confirmGameStats.isPending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {confirmGameStats.isPending ? 'Confirming...' : 'Confirm All Stats'}
          </button>
          {confirmGameStats.isError && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Failed to confirm stats. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
