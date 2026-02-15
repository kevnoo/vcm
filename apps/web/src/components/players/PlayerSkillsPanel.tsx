import { useState, useMemo } from 'react';
import type { PlayerSkill, SkillGroup } from '@vcm/shared';
import { useSetPlayerSkills } from '../../hooks/usePlayers';
import { useSkillGroups } from '../../hooks/useReferenceData';

interface Props {
  playerId: string;
  skills: PlayerSkill[];
  isAdmin: boolean;
}

export function PlayerSkillsPanel({ playerId, skills, isAdmin }: Props) {
  const { data: skillGroups } = useSkillGroups();
  const setSkills = useSetPlayerSkills(playerId);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});

  // Group skills by their skill group
  const groupedSkills = useMemo(() => {
    if (!skillGroups) return [];

    return skillGroups.map((group) => {
      const groupSkills = skills.filter(
        (s) => s.skillDefinition?.skillGroup?.id === group.id,
      );
      return { group, skills: groupSkills };
    });
  }, [skillGroups, skills]);

  const startEditing = () => {
    const values: Record<string, number> = {};
    for (const skill of skills) {
      values[skill.skillDefinitionId] = skill.value;
    }
    setEditValues(values);
    setEditing(true);
  };

  const handleSave = () => {
    setSkills.mutate(
      {
        skills: Object.entries(editValues).map(([skillDefinitionId, value]) => ({
          skillDefinitionId,
          value,
        })),
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'text-green-700 bg-green-50';
    if (value >= 60) return 'text-yellow-700 bg-yellow-50';
    if (value >= 40) return 'text-orange-700 bg-orange-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
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
              disabled={setSkills.isPending}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded font-medium"
            >
              {setSkills.isPending ? 'Saving...' : 'Save'}
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

      <div className="space-y-6">
        {groupedSkills.map(({ group, skills: groupSkills }) => (
          <div key={group.id}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              {group.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groupSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between py-1 px-2 rounded"
                >
                  <span className="text-sm text-gray-700">
                    {skill.skillDefinition?.name}
                  </span>
                  {editing ? (
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={editValues[skill.skillDefinitionId] ?? skill.value}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [skill.skillDefinitionId]: Math.min(
                            99,
                            Math.max(0, parseInt(e.target.value, 10) || 0),
                          ),
                        }))
                      }
                      className="w-16 text-center rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded ${getSkillColor(skill.value)}`}
                    >
                      {skill.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {setSkills.isError && (
        <p className="text-red-600 text-sm mt-2">Failed to save skills.</p>
      )}
    </div>
  );
}
