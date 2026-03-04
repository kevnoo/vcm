import { useState } from 'react';
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
  const [claimingPlayerId, setClaimingPlayerId] = useState<string | null>(null);

  const handleClaim = (playerId: string) => {
    if (!userTeam) return;
    claimFreeAgent.mutate(
      { playerId, teamId: userTeam.id },
      { onSuccess: () => setClaimingPlayerId(null) },
    );
  };

  return (
    <div className="space-y-4">
      {userTeam && (
        <div className="text-sm text-[var(--text-secondary)]">
          Your budget: <span className="font-medium text-[var(--text-primary)]">{userTeam.budget.toLocaleString()}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading free agents...</p>
      ) : freeAgents && freeAgents.length > 0 ? (
        <div className="grid gap-3">
          {freeAgents.map((player) => (
            <div
              key={player.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--surface-card)] border border-[var(--border)] rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                {player.imageUrl ? (
                  <img
                    src={player.imageUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-secondary)] text-sm font-bold">
                    {player.firstName.charAt(0)}
                    {player.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <Link
                    to={`/players/${player.id}`}
                    className="text-sm font-medium text-[var(--accent-primary)] hover:brightness-110"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-block bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-medium px-2 py-0.5 rounded">
                      {player.primaryPosition}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">Age {player.age}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PlayerValueBadge value={player.computedValue} size="md" />
                {userTeam && (
                  claimingPlayerId === player.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400">50% value deducted</span>
                      <button
                        onClick={() => handleClaim(player.id)}
                        disabled={claimFreeAgent.isPending}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
                      >
                        {claimFreeAgent.isPending ? 'Claiming...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setClaimingPlayerId(null)}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setClaimingPlayerId(player.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded"
                    >
                      Claim
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-secondary)] text-sm">No free agents available.</p>
      )}
    </div>
  );
}
