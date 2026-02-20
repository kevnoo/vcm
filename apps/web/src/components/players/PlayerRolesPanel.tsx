import { useState } from 'react';
import type { PlayerPosition } from '@vcm/shared';
import type { Position } from '@vcm/shared';
import { RoleLevel } from '@vcm/shared';
import { useAssignPlayerRoles } from '../../hooks/usePlayers';
import { usePlayerRoleDefinitions } from '../../hooks/useReferenceData';

interface Props {
  playerId: string;
  positions: PlayerPosition[];
  isAdmin: boolean;
}

const ROLE_LEVELS = Object.values(RoleLevel);

const levelColors: Record<string, string> = {
  BASIC: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  INTERMEDIATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADVANCED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function PositionRolesSection({
  playerId,
  position,
  isAdmin,
}: {
  playerId: string;
  position: PlayerPosition;
  isAdmin: boolean;
}) {
  const { data: availableRoles } = usePlayerRoleDefinitions(position.position);
  const assignRoles = useAssignPlayerRoles(playerId);
  const [editing, setEditing] = useState(false);
  const [editAssignments, setEditAssignments] = useState<
    Record<string, { selected: boolean; level: string }>
  >({});

  const roles = position.roles ?? [];

  const startEditing = () => {
    const assignments: Record<string, { selected: boolean; level: string }> = {};
    if (availableRoles) {
      for (const role of availableRoles) {
        const existing = roles.find((r) => r.playerRoleDefinitionId === role.id);
        assignments[role.id] = {
          selected: !!existing,
          level: existing?.level ?? 'BASIC',
        };
      }
    }
    setEditAssignments(assignments);
    setEditing(true);
  };

  const handleSave = () => {
    const selectedRoles = Object.entries(editAssignments)
      .filter(([, v]) => v.selected)
      .map(([playerRoleDefinitionId, v]) => ({
        playerRoleDefinitionId,
        level: v.level as RoleLevel,
      }));

    assignRoles.mutate(
      {
        positionRoles: [{ position: position.position, roles: selectedRoles }],
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {position.position}
          {position.isPrimary && (
            <span className="ml-2 text-xs font-normal text-indigo-600">(Primary)</span>
          )}
        </h3>
        {isAdmin && !editing && (
          <button
            onClick={startEditing}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={assignRoles.isPending}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-2 py-1 rounded font-medium"
            >
              {assignRoles.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No roles assigned.</p>
          ) : (
            roles.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {assignment.roleDefinition?.name}
                  </span>
                  {assignment.roleDefinition?.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {assignment.roleDefinition.description}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${levelColors[assignment.level]}`}
                >
                  {assignment.level}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {availableRoles?.map((role) => {
            const assignment = editAssignments[role.id];
            return (
              <div
                key={role.id}
                className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assignment?.selected ?? false}
                    onChange={(e) =>
                      setEditAssignments((prev) => ({
                        ...prev,
                        [role.id]: { ...prev[role.id], selected: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{role.name}</span>
                    {role.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{role.description}</p>
                    )}
                  </div>
                </label>
                {assignment?.selected && (
                  <select
                    value={assignment.level}
                    onChange={(e) =>
                      setEditAssignments((prev) => ({
                        ...prev,
                        [role.id]: { ...prev[role.id], level: e.target.value },
                      }))
                    }
                    className="text-xs rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ROLE_LEVELS.map((level) => (
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

      {assignRoles.isError && (
        <p className="text-red-600 text-xs mt-2">Failed to save roles.</p>
      )}
    </div>
  );
}

export function PlayerRolesPanel({ playerId, positions, isAdmin }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Roles</h2>
      {positions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No positions assigned.</p>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => (
            <PositionRolesSection
              key={position.id}
              playerId={playerId}
              position={position}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
