import { useState } from 'react';
import { Link } from 'react-router';
import { useTeamItems, useUseItem, useTeamItemHistory } from '../../hooks/useItems';
import { useTeams } from '../../hooks/useTeams';
import { usePlayers } from '../../hooks/usePlayers';
import { useAuthStore } from '../../stores/auth.store';
import type { TeamItem, Player } from '@vcm/shared';

function formatEffect(item: TeamItem): string {
  const def = item.itemDefinition;
  if (!def) return '';
  switch (def.effectType) {
    case 'BOOST_OVERALL':
      return `+${def.effectValue} Overall`;
    case 'BOOST_WEAK_FOOT':
      return `+${def.effectValue} Weak Foot`;
    case 'BOOST_POTENTIAL':
      return `+${def.effectValue} Potential`;
    case 'SET_OVERALL':
      return `Set Overall to ${def.effectValue}`;
    default:
      return `${def.effectType} (${def.effectValue})`;
  }
}

export function InventoryPage() {
  const { data: teams } = useTeams();
  const { user } = useAuthStore();

  const myTeam = teams?.find((t) => t.ownerId === user?.id);
  const teamId = myTeam?.id ?? '';

  const { data: inventory, isLoading } = useTeamItems(teamId);
  const { data: players } = usePlayers({ teamId });
  const { data: history } = useTeamItemHistory(teamId);
  const useItem = useUseItem(teamId);

  const [usingItem, setUsingItem] = useState<TeamItem | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  if (!myTeam) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Inventory</h1>
        <p className="text-gray-500 dark:text-gray-400">You don't own a team.</p>
      </div>
    );
  }

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  const handleUse = () => {
    if (!usingItem || !selectedPlayer) return;
    useItem.mutate(
      { teamItemId: usingItem.id, playerId: selectedPlayer },
      {
        onSuccess: () => {
          setUsingItem(null);
          setSelectedPlayer('');
        },
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
        <Link
          to="/shop"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Visit Shop
        </Link>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Team: <span className="font-medium text-gray-700 dark:text-gray-300">{myTeam.name}</span>
        {' | '}Budget: <span className="font-medium text-gray-700 dark:text-gray-300">{myTeam.budget.toLocaleString()}</span>
      </p>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Items ({inventory?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Usage History
          </button>
        </nav>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-3">
          {inventory?.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No items in inventory.{' '}
              <Link to="/shop" className="text-indigo-600 hover:text-indigo-700">
                Visit the shop
              </Link>{' '}
              to buy some.
            </p>
          )}
          {inventory?.map((teamItem) => (
            <div key={teamItem.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {teamItem.itemDefinition?.name}
                    </span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded font-medium">
                      {formatEffect(teamItem)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Quantity: <span className="font-medium">{teamItem.quantity}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUsingItem(teamItem);
                    setSelectedPlayer('');
                  }}
                  disabled={teamItem.quantity <= 0}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Use
                </button>
              </div>

              {usingItem?.id === teamItem.id && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select a player to use this item on:
                  </p>
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select a player</option>
                      {players?.map((p: Player) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} (OVR: {p.overall}, WF: {p.weakFoot}, POT: {p.potential})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleUse}
                      disabled={!selectedPlayer || useItem.isPending}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setUsingItem(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                  {useItem.isError && (
                    <p className="mt-2 text-sm text-red-600">
                      {(useItem.error as any)?.response?.data?.message ?? 'Failed to use item'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {history?.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No items used yet.</p>
          )}
          {history?.map((log) => (
            <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {log.itemDefinition?.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mx-2">used on</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {log.player?.firstName} {log.player?.lastName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {log.previousValue} → {log.newValue}
                </span>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(log.usedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
