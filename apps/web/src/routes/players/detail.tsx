import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { usePlayer, useUpdatePlayer, useDeletePlayer } from '../../hooks/usePlayers';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import { PlayerSkillsPanel } from '../../components/players/PlayerSkillsPanel';
import { PlayerRolesPanel } from '../../components/players/PlayerRolesPanel';
import { PlayerPlayStylesPanel } from '../../components/players/PlayerPlayStylesPanel';
import { PlayerValueBadge } from '../../components/transfers/PlayerValueBadge';
import { TransactionRow } from '../../components/transfers/TransactionRow';
import { usePlayerValue } from '../../hooks/usePlayerValue';
import { useTransactions } from '../../hooks/useTransactions';
import { useReleasePlayer } from '../../hooks/useWaivers';
import { useClaimFreeAgent } from '../../hooks/useFreeAgency';
import { Position } from '@vcm/shared';

const POSITIONS = Object.values(Position);

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const { data: player, isLoading } = usePlayer(id!);
  const { data: teams } = useTeams();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();
  const { data: playerValue } = usePlayerValue(id!);
  const { data: transactions } = useTransactions({ playerId: id });
  const releasePlayer = useReleasePlayer();
  const claimFreeAgent = useClaimFreeAgent();

  const userTeam = teams?.find((t) => t.ownerId === user?.id);
  const isOnUserTeam = userTeam && player?.teamId === userTeam.id;
  const isOnAnotherTeam = player?.teamId && !isOnUserTeam;
  const isFreeAgent = !player?.teamId;

  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    primaryPosition: '' as Position | '',
    alternativePositions: [] as Position[],
    teamId: '',
    imageUrl: '',
  });

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!player) return <p className="text-gray-500 dark:text-gray-400">Player not found.</p>;

  const altPositions = player.positions?.filter((p) => !p.isPrimary) ?? [];

  const startEditingInfo = () => {
    setEditForm({
      firstName: player.firstName,
      lastName: player.lastName,
      age: String(player.age),
      primaryPosition: player.primaryPosition,
      alternativePositions: altPositions.map((p) => p.position),
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
        alternativePositions: editForm.alternativePositions,
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

  const toggleAltPosition = (pos: Position) => {
    setEditForm((f) => ({
      ...f,
      alternativePositions: f.alternativePositions.includes(pos)
        ? f.alternativePositions.filter((p) => p !== pos)
        : [...f.alternativePositions, pos],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-2xl font-bold">
                {player.firstName.charAt(0)}
                {player.lastName.charAt(0)}
              </div>
            )}
            {!editingInfo ? (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {player.firstName} {player.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-sm font-medium px-2.5 py-0.5 rounded">
                    {player.primaryPosition}
                  </span>
                  {altPositions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded"
                    >
                      {p.position}
                    </span>
                  ))}
                  <span className="text-gray-500 dark:text-gray-400">Age {player.age}</span>
                  <PlayerValueBadge value={playerValue?.totalValue} size="md" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        alternativePositions: f.alternativePositions.filter(
                          (p) => p !== e.target.value,
                        ),
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
                {/* Alternative Positions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alternative Positions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.filter((pos) => pos !== editForm.primaryPosition).map(
                      (pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => toggleAltPosition(pos)}
                          className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors ${
                            editForm.alternativePositions.includes(pos)
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pos}
                        </button>
                      ),
                    )}
                  </div>
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
                    className="text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          {isAdmin() && !editingInfo && (
            <div className="flex flex-wrap gap-2">
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
        positions={player.positions ?? []}
        isAdmin={isAdmin()}
      />

      {/* Play Styles */}
      <PlayerPlayStylesPanel
        playerId={player.id}
        playerPosition={player.primaryPosition}
        playStyles={player.playStyles ?? []}
        isAdmin={isAdmin()}
      />

      {/* Transaction Actions */}
      {userTeam && !editingInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Actions</h2>
          <div className="flex gap-2">
            {isOnAnotherTeam && (
              <Link
                to={`/transfers/create-trade?teamId=${player.teamId}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded"
              >
                Make Trade Offer
              </Link>
            )}
            {isFreeAgent && (
              <button
                onClick={() => {
                  if (!confirm('Claim this free agent? 50% of their value will be deducted from your budget.')) return;
                  claimFreeAgent.mutate({ playerId: player.id, teamId: userTeam.id });
                }}
                disabled={claimFreeAgent.isPending}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                Claim Free Agent
              </button>
            )}
            {isOnUserTeam && (
              <button
                onClick={() => {
                  if (!confirm(`Release ${player.firstName} ${player.lastName} to waivers?`)) return;
                  releasePlayer.mutate(player.id);
                }}
                disabled={releasePlayer.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                Release
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactions && transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction History</h2>
          </div>
          <div className="p-4 space-y-2">
            {transactions.slice(0, 10).map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
