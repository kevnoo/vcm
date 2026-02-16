import { useFreeAgents, useClaimFreeAgent } from '../../hooks/useFreeAgency';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import { PlayerValueBadge } from '../../components/transfers/PlayerValueBadge';
import { Link } from 'react-router';

export function FreeAgencyTab() {
  const { data: freeAgents, isLoading } = useFreeAgents();
  const { user } = useAuthStore();
  const { data: teams } = useTeams();
  const claimFreeAgent = useClaimFreeAgent();

  const userTeam = teams?.find((t) => t.ownerId === user?.id);

  const handleClaim = (playerId: string) => {
    if (!userTeam) return;
    if (!confirm('Are you sure you want to claim this free agent? 50% of their value will be deducted from your budget.')) return;
    claimFreeAgent.mutate({ playerId, teamId: userTeam.id });
  };

  return (
    <div className="space-y-4">
      {userTeam && (
        <div className="text-sm text-gray-500">
          Your budget: <span className="font-medium text-gray-900">{userTeam.budget.toLocaleString()}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading free agents...</p>
      ) : freeAgents && freeAgents.length > 0 ? (
        <div className="grid gap-3">
          {freeAgents.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-white rounded-lg shadow p-4"
            >
              <div className="flex items-center gap-3">
                {player.imageUrl ? (
                  <img
                    src={player.imageUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                    {player.firstName.charAt(0)}
                    {player.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <Link
                    to={`/players/${player.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                      {player.primaryPosition}
                    </span>
                    <span className="text-xs text-gray-500">Age {player.age}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PlayerValueBadge value={player.computedValue} size="md" />
                {userTeam && (
                  <button
                    onClick={() => handleClaim(player.id)}
                    disabled={claimFreeAgent.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No free agents available.</p>
      )}
    </div>
  );
}
