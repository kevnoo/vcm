import { Link } from 'react-router';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';

export function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (isLoading) return <p className="text-gray-500">Loading teams...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        {isAdmin() && (
          <Link
            to="/teams/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Add Team
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams?.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold">
                  {team.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{team.name}</p>
                <p className="text-sm text-gray-500">
                  {team.owner?.discordUsername ?? 'No owner'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {teams?.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No teams yet. {isAdmin() ? 'Create one to get started.' : ''}
        </p>
      )}
    </div>
  );
}
