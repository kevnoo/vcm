import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreatePlayer } from '../../hooks/usePlayers';
import { useTeams } from '../../hooks/useTeams';
import { Position } from '@vcm/shared';

const POSITIONS = Object.values(Position);

export function CreatePlayerPage() {
  const navigate = useNavigate();
  const createPlayer = useCreatePlayer();
  const { data: teams } = useTeams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [primaryPosition, setPrimaryPosition] = useState<Position | ''>('');
  const [alternativePositions, setAlternativePositions] = useState<Position[]>([]);
  const [teamId, setTeamId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const toggleAltPosition = (pos: Position) => {
    setAlternativePositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryPosition) return;

    createPlayer.mutate(
      {
        firstName,
        lastName,
        age: parseInt(age, 10),
        primaryPosition,
        alternativePositions: alternativePositions.length > 0 ? alternativePositions : undefined,
        teamId: teamId || undefined,
        imageUrl: imageUrl || undefined,
      },
      {
        onSuccess: (player) => navigate(`/players/${player.id}`),
      },
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Create Player</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            min={1}
            max={99}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Primary Position
          </label>
          <select
            value={primaryPosition}
            onChange={(e) => {
              const newPos = e.target.value as Position;
              setPrimaryPosition(newPos);
              setAlternativePositions((prev) => prev.filter((p) => p !== newPos));
            }}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a position</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {primaryPosition && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alternative Positions (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.filter((pos) => pos !== primaryPosition).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleAltPosition(pos)}
                  className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors ${
                    alternativePositions.includes(pos)
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team (optional)
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Free Agent</option>
            {teams?.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createPlayer.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {createPlayer.isPending ? 'Creating...' : 'Create Player'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/players')}
            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        {createPlayer.isError && (
          <p className="text-red-600 text-sm">
            Failed to create player. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
