import { useState } from 'react';
import { useShopItems, useBuyItem } from '../../hooks/useItems';
import { useShopBundles, useBuyBundle } from '../../hooks/useBundles';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import type { ItemDefinition, Bundle } from '@vcm/shared';

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
  const { data: items, isLoading: itemsLoading } = useShopItems();
  const { data: bundles, isLoading: bundlesLoading } = useShopBundles();
  const { data: teams } = useTeams();
  const { user } = useAuthStore();

  const myTeam = teams?.find((t) => t.ownerId === user?.id);
  const buyItem = useBuyItem(myTeam?.id ?? '');
  const buyBundle = useBuyBundle(myTeam?.id ?? '');

  const [buyingItem, setBuyingItem] = useState<string | null>(null);
  const [buyingBundle, setBuyingBundle] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [activeTab, setActiveTab] = useState<'items' | 'bundles'>('items');

  const isLoading = itemsLoading || bundlesLoading;
  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  const handleBuyItem = (itemId: string) => {
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

  const handleBuyBundle = (bundleId: string) => {
    if (!myTeam) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) return;
    buyBundle.mutate(
      { bundleId, quantity: qty },
      {
        onSuccess: () => {
          setBuyingBundle(null);
          setQuantity('1');
        },
      },
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Shop</h1>
      {myTeam && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your team: <span className="font-medium text-gray-700 dark:text-gray-300">{myTeam.name}</span>
          {' | '}Budget: <span className="font-medium text-gray-700 dark:text-gray-300">{myTeam.budget.toLocaleString()}</span>
        </p>
      )}
      {!myTeam && (
        <p className="text-sm text-yellow-600 mb-6">
          You don't own a team. Only team owners can purchase items.
        </p>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'items'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Items ({items?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'bundles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Bundles ({bundles?.length ?? 0})
          </button>
        </nav>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          {items?.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No items available in the shop.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items?.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 flex flex-col">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                )}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-block bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded text-xs font-medium">
                    {formatEffect(item)}
                  </span>
                </div>
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {item.price.toLocaleString()}
                    </span>
                    {myTeam && buyingItem !== item.id && (
                      <button
                        onClick={() => {
                          setBuyingItem(item.id);
                          setBuyingBundle(null);
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
                      <label className="text-sm text-gray-600 dark:text-gray-400">Qty:</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min={1}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {(item.price * (parseInt(quantity, 10) || 0)).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleBuyItem(item.id)}
                        disabled={buyItem.isPending}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setBuyingItem(null)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
        </>
      )}

      {/* Bundles Tab */}
      {activeTab === 'bundles' && (
        <>
          {bundles?.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No bundles available in the shop.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles?.map((bundle) => {
              const individualTotal =
                bundle.items?.reduce(
                  (sum, bi) => sum + (bi.itemDefinition?.price ?? 0) * bi.quantity,
                  0,
                ) ?? 0;
              const savings = individualTotal - bundle.price;

              return (
                <div key={bundle.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 flex flex-col border-2 border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{bundle.name}</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                      Bundle
                    </span>
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{bundle.description}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {bundle.items?.map((bi) => (
                      <div key={bi.id} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                        <span>{bi.itemDefinition?.name}</span>
                        <span className="text-gray-400 dark:text-gray-500">x{bi.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {bundle.price.toLocaleString()}
                        </span>
                        {savings > 0 && (
                          <span className="ml-2 text-xs text-green-600 font-medium">
                            Save {savings.toLocaleString()}
                          </span>
                        )}
                        {individualTotal > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-through">
                            {individualTotal.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {myTeam && buyingBundle !== bundle.id && (
                        <button
                          onClick={() => {
                            setBuyingBundle(bundle.id);
                            setBuyingItem(null);
                            setQuantity('1');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Buy
                        </button>
                      )}
                    </div>
                    {buyingBundle === bundle.id && (
                      <div className="mt-3 flex gap-2 items-center">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Qty:</label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          min={1}
                          className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Total: {(bundle.price * (parseInt(quantity, 10) || 0)).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleBuyBundle(bundle.id)}
                          disabled={buyBundle.isPending}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setBuyingBundle(null)}
                          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {buyBundle.isError && buyingBundle === bundle.id && (
                      <p className="mt-2 text-sm text-red-600">
                        {(buyBundle.error as any)?.response?.data?.message ?? 'Purchase failed'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
