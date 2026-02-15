import { useState, useMemo } from 'react';
import type { PlayerRoleAssignment } from '@vcm/shared';
import type { Position } from '@vcm/shared';
import { RoleLevel } from '@vcm/shared';
import { useAssignPlayerRoles } from '../../hooks/usePlayers';
import { usePlayerRoleDefinitions } from '../../hooks/useReferenceData';

interface Props {
  playerId: string;
  playerPosition: Position;
  roles: PlayerRoleAssignment[];
  isAdmin: boolean;
}

const ROLE_LEVELS = Object.values(RoleLevel);

const levelColors: Record<string, string> = {
  BASIC: 'bg-gray-100 text-gray-700',
  INTERMEDIATE: 'bg-blue-100 text-blue-700',
  ADVANCED: 'bg-purple-100 text-purple-700',
};

export function PlayerRolesPanel({ playerId, playerPosition, roles, isAdmin }: Props) {
  const { data: availableRoles } = usePlayerRoleDefinitions(playerPosition);
  const assignRoles = useAssignPlayerRoles(playerId);
  const [editing, setEditing] = useState(false);
  const [editAssignments, setEditAssignments] = useState<
    Record<string, { selected: boolean; level: string }>
  >({});

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

    assignRoles.mutate({ roles: selectedRoles }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
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
              disabled={assignRoles.isPending}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded font-medium"
            >
              {assignRoles.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-sm text-gray-500">No roles assigned.</p>
          ) : (
            roles.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {assignment.roleDefinition?.name}
                  </span>
                  {assignment.roleDefinition?.description && (
                    <p className="text-xs text-gray-500">
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
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
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
                    <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    {role.description && (
                      <p className="text-xs text-gray-500">{role.description}</p>
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
        <p className="text-red-600 text-sm mt-2">Failed to save roles.</p>
      )}
    </div>
  );
}
