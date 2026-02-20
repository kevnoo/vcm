import { useState } from 'react';
import type { PlayerPlayStyleAssignment } from '@vcm/shared';
import type { Position } from '@vcm/shared';
import { PlayStyleLevel } from '@vcm/shared';
import { useAssignPlayerPlayStyles } from '../../hooks/usePlayers';
import { usePlayStyleDefinitions } from '../../hooks/useReferenceData';

interface Props {
  playerId: string;
  playerPosition: Position;
  playStyles: PlayerPlayStyleAssignment[];
  isAdmin: boolean;
}

const PLAY_STYLE_LEVELS = Object.values(PlayStyleLevel);

const levelColors: Record<string, string> = {
  BASIC: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ADVANCED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function PlayerPlayStylesPanel({
  playerId,
  playerPosition,
  playStyles,
  isAdmin,
}: Props) {
  const { data: availableStyles } = usePlayStyleDefinitions(playerPosition);
  const assignPlayStyles = useAssignPlayerPlayStyles(playerId);
  const [editing, setEditing] = useState(false);
  const [editAssignments, setEditAssignments] = useState<
    Record<string, { selected: boolean; level: string }>
  >({});

  const startEditing = () => {
    const assignments: Record<string, { selected: boolean; level: string }> = {};
    if (availableStyles) {
      for (const style of availableStyles) {
        const existing = playStyles.find((ps) => ps.playStyleDefinitionId === style.id);
        assignments[style.id] = {
          selected: !!existing,
          level: existing?.level ?? 'BASIC',
        };
      }
    }
    setEditAssignments(assignments);
    setEditing(true);
  };

  const handleSave = () => {
    const selected = Object.entries(editAssignments)
      .filter(([, v]) => v.selected)
      .map(([playStyleDefinitionId, v]) => ({
        playStyleDefinitionId,
        level: v.level as PlayStyleLevel,
      }));

    assignPlayStyles.mutate(
      { playStyles: selected },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Play Styles</h2>
        {isAdmin && !editing && (
          <button
            onClick={startEditing}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={assignPlayStyles.isPending}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded font-medium"
            >
              {assignPlayStyles.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-3 py-1 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="flex flex-wrap gap-2">
          {playStyles.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No play styles assigned.</p>
          ) : (
            playStyles.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-full"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {assignment.playStyleDefinition?.name}
                </span>
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${levelColors[assignment.level]}`}
                >
                  {assignment.level}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {availableStyles?.map((style) => {
            const assignment = editAssignments[style.id];
            return (
              <div
                key={style.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assignment?.selected ?? false}
                    onChange={(e) =>
                      setEditAssignments((prev) => ({
                        ...prev,
                        [style.id]: { ...prev[style.id], selected: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {style.name}
                    </span>
                    {style.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{style.description}</p>
                    )}
                  </div>
                </label>
                {assignment?.selected && (
                  <select
                    value={assignment.level}
                    onChange={(e) =>
                      setEditAssignments((prev) => ({
                        ...prev,
                        [style.id]: { ...prev[style.id], level: e.target.value },
                      }))
                    }
                    className="text-xs rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PLAY_STYLE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assignPlayStyles.isError && (
        <p className="text-red-600 text-sm mt-2">Failed to save play styles.</p>
      )}
    </div>
  );
}
