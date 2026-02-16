import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTeam, useSetTeamBudget } from '../../hooks/useTeams';
import { usePlayers } from '../../hooks/usePlayers';
import { useTrades } from '../../hooks/useTrades';
import { useAuthStore } from '../../stores/auth.store';
import { TradeOfferCard } from '../../components/transfers/TradeOfferCard';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading } = useTeam(id!);
  const { data: players, isLoading: playersLoading } = usePlayers({ teamId: id });
  const { data: pendingTrades } = useTrades({ teamId: id, status: 'PENDING' });
  const { isAdmin } = useAuthStore();
  const setBudget = useSetTeamBudget();

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!team) return <p className="text-gray-500">Team not found.</p>;

  const startEditBudget = () => {
    setBudgetInput(String(team.budget));
    setEditingBudget(true);
  };

  const saveBudget = () => {
    const budget = parseInt(budgetInput, 10);
    if (isNaN(budget) || budget < 0) return;
    setBudget.mutate(
      { id: team.id, budget },
      { onSuccess: () => setEditingBudget(false) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
            {team.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-500">
            Owner: {team.owner?.discordUsername ?? 'None'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">
              Budget: <span className="font-medium text-gray-900">{team.budget.toLocaleString()}</span>
            </span>
            {isAdmin() && !editingBudget && (
              <button
                onClick={startEditBudget}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Set Budget
              </button>
            )}
            {editingBudget && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  min={0}
                  className="rounded border border-gray-300 px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={saveBudget}
                  disabled={setBudget.isPending}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingBudget(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Roster</h2>
        </div>
        <div className="p-4">
          {playersLoading ? (
            <p className="text-gray-500 text-sm">Loading roster...</p>
          ) : players && players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player) => (
                <Link
                  key={player.id}
                  to={`/players/${player.id}`}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {player.imageUrl ? (
                      <img
                        src={player.imageUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                        {player.firstName.charAt(0)}
                        {player.lastName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                      {player.primaryPosition}
                    </span>
                    {player.positions
                      ?.filter((p) => !p.isPrimary)
                      .map((p) => (
                        <span
                          key={p.id}
                          className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded"
                        >
                          {p.position}
                        </span>
                      ))}
                    <span className="text-xs text-gray-500">Age {player.age}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No players on this team.</p>
          )}
        </div>
      </div>

      {/* Pending Trades */}
      {pendingTrades && pendingTrades.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Pending Trades</h2>
          </div>
          <div className="p-4 grid gap-4 md:grid-cols-2">
            {pendingTrades.map((trade) => (
              <TradeOfferCard key={trade.id} trade={trade} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
