import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { usePlayer, useUpdatePlayer, useDeletePlayer } from '../../hooks/usePlayers';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import { PlayerSkillsPanel } from '../../components/players/PlayerSkillsPanel';
import { PlayerRolesPanel } from '../../components/players/PlayerRolesPanel';
import { PlayerPlayStylesPanel } from '../../components/players/PlayerPlayStylesPanel';
import { Position } from '@vcm/shared';

const POSITIONS = Object.values(Position);

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const { data: player, isLoading } = usePlayer(id!);
  const { data: teams } = useTeams();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    primaryPosition: '' as Position | '',
    teamId: '',
    imageUrl: '',
  });

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!player) return <p className="text-gray-500">Player not found.</p>;

  const startEditingInfo = () => {
    setEditForm({
      firstName: player.firstName,
      lastName: player.lastName,
      age: String(player.age),
      primaryPosition: player.primaryPosition,
      teamId: player.teamId ?? '',
      imageUrl: player.imageUrl ?? '',
    });
    setEditingInfo(true);
  };

  const handleSaveInfo = () => {
    if (!editForm.primaryPosition) return;
    updatePlayer.mutate(
      {
        id: player.id,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        age: parseInt(editForm.age, 10),
        primaryPosition: editForm.primaryPosition,
        teamId: editForm.teamId || null,
        imageUrl: editForm.imageUrl || null,
      },
      { onSuccess: () => setEditingInfo(false) },
    );
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${player.firstName} ${player.lastName}?`)) return;
    deletePlayer.mutate(player.id, {
      onSuccess: () => navigate('/players'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                {player.firstName.charAt(0)}
                {player.lastName.charAt(0)}
              </div>
            )}
            {!editingInfo ? (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {player.firstName} {player.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {player.primaryPosition}
                  </span>
                  <span className="text-gray-500">Age {player.age}</span>
                </div>
                <p className="text-gray-500 mt-1">
                  {player.team ? (
                    <Link
                      to={`/teams/${player.team.id}`}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {player.team.name}
                    </Link>
                  ) : (
                    'Free Agent'
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="First Name"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Last Name"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm((f) => ({ ...f, age: e.target.value }))}
                    placeholder="Age"
                    min={1}
                    max={99}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={editForm.primaryPosition}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        primaryPosition: e.target.value as Position,
                      }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editForm.teamId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, teamId: e.target.value }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Free Agent</option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  placeholder="Image URL (optional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveInfo}
                    disabled={updatePlayer.isPending}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded font-medium"
                  >
                    {updatePlayer.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingInfo(false)}
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          {isAdmin() && !editingInfo && (
            <div className="flex gap-2">
              <button
                onClick={startEditingInfo}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Edit Info
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <PlayerSkillsPanel
        playerId={player.id}
        skills={player.skills ?? []}
        isAdmin={isAdmin()}
      />

      {/* Roles */}
      <PlayerRolesPanel
        playerId={player.id}
        playerPosition={player.primaryPosition}
        roles={player.roles ?? []}
        isAdmin={isAdmin()}
      />

      {/* Play Styles */}
      <PlayerPlayStylesPanel
        playerId={player.id}
        playerPosition={player.primaryPosition}
        playStyles={player.playStyles ?? []}
        isAdmin={isAdmin()}
      />
    </div>
  );
}
