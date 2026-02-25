import { Link } from 'react-router';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useAuthStore } from '../../stores/auth.store';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

export function CompetitionsPage() {
  const { data: competitions, isLoading } = useCompetitions();
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (isLoading) return <p className="text-gray-500">Loading competitions...</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Competitions</h1>
        {isAdmin() && (
          <Link
            to="/competitions/create"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            Create Competition
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {competitions?.map((comp) => (
          <Link
            key={comp.id}
            to={`/competitions/${comp.id}`}
            className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{comp.name}</p>
                <p className="text-sm text-gray-500">
                  {comp.type.replace(/_/g, ' ')} &middot;{' '}
                  {comp.teams?.length ?? 0} teams
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${statusColors[comp.status] ?? ''}`}
              >
                {comp.status}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {competitions?.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No competitions yet. {isAdmin() ? 'Create one to get started.' : ''}
        </p>
      )}
    </div>
  );
}
