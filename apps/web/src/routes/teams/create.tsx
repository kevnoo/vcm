import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateTeam } from '../../hooks/useTeams';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { User } from '@vcm/shared';

export function CreateTeamPage() {
  const navigate = useNavigate();
  const createTeam = useCreateTeam();
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ownerId, setOwnerId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate(
      { name, logoUrl: logoUrl || undefined, ownerId },
      { onSuccess: () => navigate('/teams') },
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Team</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL (optional)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner
          </label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select an owner</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.discordUsername}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createTeam.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {createTeam.isPending ? 'Creating...' : 'Create Team'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/teams')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        {createTeam.isError && (
          <p className="text-red-600 text-sm">
            Failed to create team. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
