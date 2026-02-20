import { useState } from 'react';
import { useShopItems, useBuyItem } from '../../hooks/useItems';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import type { ItemDefinition } from '@vcm/shared';

const EFFECT_TYPE_LABELS: Record<string, string> = {
  BOOST_OVERALL: '+N Overall',
  BOOST_WEAK_FOOT: '+N Weak Foot',
  BOOST_POTENTIAL: '+N Potential',
  SET_OVERALL: 'Set Overall To',
};

function formatEffect(item: ItemDefinition): string {
  switch (item.effectType) {
    case 'BOOST_OVERALL':
      return `+${item.effectValue} Overall`;
    case 'BOOST_WEAK_FOOT':
      return `+${item.effectValue} Weak Foot`;
    case 'BOOST_POTENTIAL':
      return `+${item.effectValue} Potential`;
    case 'SET_OVERALL':
      return `Set Overall to ${item.effectValue}`;
    default:
      return `${EFFECT_TYPE_LABELS[item.effectType]} (${item.effectValue})`;
  }
}

export function ShopPage() {
  const { data: items, isLoading } = useShopItems();
  const { data: teams } = useTeams();
  const { user } = useAuthStore();

  const myTeam = teams?.find((t) => t.ownerId === user?.id);
  const buyItem = useBuyItem(myTeam?.id ?? '');

  const [buyingItem, setBuyingItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  const handleBuy = (itemId: string) => {
    if (!myTeam) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) return;
    buyItem.mutate(
      { itemDefinitionId: itemId, quantity: qty },
      {
        onSuccess: () => {
          setBuyingItem(null);
          setQuantity('1');
        },
      },
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop</h1>
      {myTeam && (
        <p className="text-sm text-gray-500 mb-6">
          Your team: <span className="font-medium text-gray-700">{myTeam.name}</span>
          {' | '}Budget: <span className="font-medium text-gray-700">{myTeam.budget.toLocaleString()}</span>
        </p>
      )}
      {!myTeam && (
        <p className="text-sm text-yellow-600 mb-6">
          You don't own a team. Only team owners can purchase items.
        </p>
      )}

      {items?.length === 0 && (
        <p className="text-gray-500">No items available in the shop.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items?.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
            <div className="mt-2 text-sm text-gray-600">
              <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                {formatEffect(item)}
              </span>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {item.price.toLocaleString()}
                </span>
                {myTeam && buyingItem !== item.id && (
                  <button
                    onClick={() => {
                      setBuyingItem(item.id);
                      setQuantity('1');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Buy
                  </button>
                )}
              </div>
              {buyingItem === item.id && (
                <div className="mt-3 flex gap-2 items-center">
                  <label className="text-sm text-gray-600">Qty:</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={1}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <span className="text-sm text-gray-500">
                    Total: {(item.price * (parseInt(quantity, 10) || 0)).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleBuy(item.id)}
                    disabled={buyItem.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setBuyingItem(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {buyItem.isError && buyingItem === item.id && (
                <p className="mt-2 text-sm text-red-600">
                  {(buyItem.error as any)?.response?.data?.message ?? 'Purchase failed'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
