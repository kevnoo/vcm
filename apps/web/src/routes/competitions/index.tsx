import { Link } from 'react-router';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useAuthStore } from '../../stores/auth.store';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function CompetitionsPage() {
  const { data: competitions, isLoading } = useCompetitions();
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading competitions...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Competitions</h1>
        {isAdmin() && (
          <Link
            to="/competitions/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
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
            className="block bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{comp.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
        <p className="text-gray-500 dark:text-gray-400 text-center py-12">
          No competitions yet. {isAdmin() ? 'Create one to get started.' : ''}
        </p>
      )}
    </div>
  );
}
