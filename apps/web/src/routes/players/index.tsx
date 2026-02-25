import { useState } from 'react';
import { Link } from 'react-router';
import { usePlayers } from '../../hooks/usePlayers';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import { Position } from '@vcm/shared';

const POSITIONS = Object.values(Position);

export function PlayersPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [positionFilter, setPositionFilter] = useState<Position | ''>('');
  const [teamFilter, setTeamFilter] = useState('');
  const [freeAgentsOnly, setFreeAgentsOnly] = useState(false);

  const { data: teams } = useTeams();
  const { data: players, isLoading } = usePlayers({
    position: positionFilter || undefined,
    teamId: teamFilter || undefined,
    freeAgents: freeAgentsOnly || undefined,
  });

  if (isLoading) return <p className="text-gray-500">Loading players...</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Players</h1>
        {isAdmin() && (
          <Link
            to="/players/create"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            Add Player
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as Position | '')}
          className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>

        <select
          value={teamFilter}
          onChange={(e) => {
            setTeamFilter(e.target.value);
            if (e.target.value) setFreeAgentsOnly(false);
          }}
          className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Teams</option>
          {teams?.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 py-2 sm:py-0 cursor-pointer">
          <input
            type="checkbox"
            checked={freeAgentsOnly}
            onChange={(e) => {
              setFreeAgentsOnly(e.target.checked);
              if (e.target.checked) setTeamFilter('');
            }}
            className="rounded border-gray-300 w-4 h-4"
          />
          Free Agents Only
        </label>
      </div>

      {/* Player Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players?.map((player) => (
          <Link
            key={player.id}
            to={`/players/${player.id}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              {player.imageUrl ? (
                <img
                  src={player.imageUrl}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold">
                  {player.firstName.charAt(0)}
                  {player.lastName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {player.firstName} {player.lastName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                    {player.primaryPosition}
                  </span>
                  <span className="text-sm text-gray-500">Age {player.age}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {player.team ? player.team.name : 'Free Agent'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {players?.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No players found. {isAdmin() ? 'Create one to get started.' : ''}
        </p>
      )}
    </div>
  );
}
