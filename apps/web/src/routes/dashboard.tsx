import { useAuthStore } from '../stores/auth.store';
import { useCompetitions } from '../hooks/useCompetitions';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: competitions, isLoading } = useCompetitions();

  const activeCompetitions = competitions?.filter((c) => c.status === 'ACTIVE') ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome, {user?.discordUsername}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Competitions</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? '...' : activeCompetitions.length}
          </p>
        </div>
      </div>

      {activeCompetitions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Competitions
          </h2>
          <div className="space-y-3">
            {activeCompetitions.map((comp) => (
              <a
                key={comp.id}
                href={`/competitions/${comp.id}`}
                className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{comp.name}</p>
                    <p className="text-sm text-gray-500">
                      {comp.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    Active
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
