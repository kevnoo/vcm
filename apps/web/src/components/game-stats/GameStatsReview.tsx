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
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
  RESOLVED: 'bg-blue-100 text-blue-800',
};

const STAT_LABELS: Record<string, string> = {
  rating: 'Rating',
  goals: 'Goals',
  assists: 'Assists',
  shots: 'Shots',
  shotAccuracy: 'Shot Accuracy %',
  passes: 'Passes',
  passAccuracy: 'Pass Accuracy %',
  dribbles: 'Dribbles',
  dribbleSuccessRate: 'Dribble Success %',
  tackles: 'Tackles',
  tackleSuccessRate: 'Tackle Success %',
  offsides: 'Offsides',
  foulsCommitted: 'Fouls',
  possessionsWon: 'Poss. Won',
  possessionsLost: 'Poss. Lost',
  minutesPlayed: 'Minutes',
  yellowCards: 'Yellow Cards',
  redCards: 'Red Cards',
  shotsAgainst: 'Shots Against',
  shotsOnTarget: 'Shots on Target',
  saves: 'Saves',
  goalsConceded: 'Goals Conceded',
  saveSuccessRate: 'Save Success %',
  cleanSheet: 'Clean Sheet',
};

const COMMON_FIELDS = [
  'rating',
  'goals',
  'assists',
  'shots',
  'shotAccuracy',
  'passes',
  'passAccuracy',
  'dribbles',
  'dribbleSuccessRate',
  'tackles',
  'tackleSuccessRate',
  'offsides',
  'foulsCommitted',
  'possessionsWon',
  'possessionsLost',
  'minutesPlayed',
  'yellowCards',
  'redCards',
] as const;

const GK_FIELDS = [
  'shotsAgainst',
  'shotsOnTarget',
  'saves',
  'goalsConceded',
  'saveSuccessRate',
  'cleanSheet',
] as const;

function StatValue({
  label,
  value,
  fieldName,
  canDispute,
  gameStatsId,
  hasDispute,
  disputeStatField,
}: {
  label: string;
  value: number | boolean | null;
  fieldName: string;
  canDispute: boolean;
  gameStatsId: string;
  hasDispute: boolean;
  disputeStatField: ReturnType<typeof useDisputeStatField>;
}) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  if (value === null || value === undefined) return null;

  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

  const handleDispute = () => {
    disputeStatField.mutate(
      {
        gameStatsId,
        fields: [{ fieldName, reason: reason || undefined }],
      },
      {
        onSuccess: () => {
          setShowReasonInput(false);
          setReason('');
        },
      },
    );
  };

  return (
    <div className="py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${hasDispute ? 'text-red-600' : 'text-gray-900'}`}>
            {displayValue}
          </span>
          {canDispute && !hasDispute && !showReasonInput && (
            <button
              onClick={() => setShowReasonInput(true)}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title="Dispute this stat"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4l13-13a1.5 1.5 0 012.12 0l1.88 1.88a1.5 1.5 0 010 2.12L7 21H3z"
                />
              </svg>
            </button>
          )}
          {hasDispute && (
            <span className="text-xs text-red-500" title="This stat is disputed">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 3.83L19.53 19H4.47L12 5.83zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z" />
              </svg>
            </span>
          )}
        </div>
      </div>
      {canDispute && !hasDispute && showReasonInput && (
        <div className="flex items-center gap-1 mt-1">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-0.5 text-xs"
          />
          <button
            onClick={handleDispute}
            disabled={disputeStatField.isPending}
            className="text-xs text-red-600 hover:text-red-800 font-medium shrink-0"
          >
            Flag
          </button>
          <button
            onClick={() => {
              setShowReasonInput(false);
              setReason('');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
}

export function GameStatsReview({
  matchId,
  stats,
  canConfirm,
  canDispute,
  canEdit = false,
}: GameStatsReviewProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [editingMinutes, setEditingMinutes] = useState<Record<string, number>>({});
  const confirmGameStats = useConfirmGameStats(matchId);
  const disputeStatField = useDisputeStatField();
  const updateGameStats = useUpdateGameStats();

  const startEditMinutes = (statId: string, currentMinutes: number) => {
    setEditingMinutes((prev) => ({ ...prev, [statId]: currentMinutes }));
  };

  const cancelEditMinutes = (statId: string) => {
    setEditingMinutes((prev) => {
      const next = { ...prev };
      delete next[statId];
      return next;
    });
  };

  const saveMinutes = (statId: string) => {
    const minutes = editingMinutes[statId];
    if (minutes === undefined) return;
    updateGameStats.mutate(
      { gameStatsId: statId, minutesPlayed: minutes },
      { onSuccess: () => cancelEditMinutes(statId) },
    );
  };

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-400 italic">No game stats submitted yet.</p>
      </div>
    );
  }

  // Determine teamId from the first stat entry
  const teamId = stats[0].teamId;

  const togglePlayer = (playerId: string) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  const handleConfirmAll = () => {
    confirmGameStats.mutate({ teamId });
  };

  // Get list of disputed fields for a player
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

  const starters = stats.filter((s) => !s.isSubstitute);
  const subs = stats.filter((s) => s.isSubstitute);

  const renderPlayerRow = (stat: MatchPlayerGameStats) => {
    const isExpanded = expandedPlayer === stat.playerId;
    const playerName = stat.player
      ? `${stat.player.firstName} ${stat.player.lastName}`
      : stat.playerId;
    const disputedFields = getDisputedFields(stat);
    const hasAnyDispute = disputedFields.size > 0;
    const isGK = stat.position === 'GK';

    return (
      <div key={stat.id} className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header row */}
        <button
          type="button"
          onClick={() => togglePlayer(stat.playerId)}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left gap-2"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {stat.position}
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">{playerName}</span>
            {stat.isSubstitute && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
                SUB
              </span>
            )}
            {hasAnyDispute && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
                DISPUTED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-sm font-bold text-gray-700">
              {stat.rating.toFixed(1)}
            </span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs ${STATUS_COLORS[stat.status] ?? ''}`}>
              {stat.status}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expanded stat fields (read-only) */}
        {isExpanded && (
          <div className="px-3 sm:px-4 py-3 divide-y divide-gray-100">
            {COMMON_FIELDS.map((field) => {
              if (field === 'minutesPlayed' && canEdit) {
                const isEditing = stat.id in editingMinutes;
                return (
                  <div key={field} className="py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{STAT_LABELS[field]}</span>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
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
                              className="w-16 rounded border border-gray-300 px-2 py-0.5 text-sm text-center"
                            />
                            <button
                              onClick={() => saveMinutes(stat.id)}
                              disabled={updateGameStats.isPending}
                              className="text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => cancelEditMinutes(stat.id)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`text-sm font-medium ${disputedFields.has(field) ? 'text-red-600' : 'text-gray-900'}`}>
                              {stat[field]}
                            </span>
                            <button
                              onClick={() => startEditMinutes(stat.id, stat.minutesPlayed)}
                              className="text-gray-300 hover:text-indigo-500 transition-colors"
                              title="Edit minutes played"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <StatValue
                  key={field}
                  label={STAT_LABELS[field]}
                  value={stat[field]}
                  fieldName={field}
                  canDispute={canDispute}
                  gameStatsId={stat.id}
                  hasDispute={disputedFields.has(field)}
                  disputeStatField={disputeStatField}
                />
              );
            })}
            {isGK &&
              GK_FIELDS.map((field) => (
                <StatValue
                  key={field}
                  label={STAT_LABELS[field]}
                  value={stat[field]}
                  fieldName={field}
                  canDispute={canDispute}
                  gameStatsId={stat.id}
                  hasDispute={disputedFields.has(field)}
                  disputeStatField={disputeStatField}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Game Stats</h3>
        {stats[0] && (
          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[stats[0].status] ?? ''}`}>
            {stats[0].status}
          </span>
        )}
      </div>

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

      {/* Confirm button */}
      {canConfirm && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={handleConfirmAll}
            disabled={confirmGameStats.isPending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
          >
            {confirmGameStats.isPending ? 'Confirming...' : 'Confirm All Stats'}
          </button>
          {confirmGameStats.isError && (
            <p className="text-sm text-red-600 mt-2">
              Failed to confirm stats. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
