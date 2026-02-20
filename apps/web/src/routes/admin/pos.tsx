import { useState } from 'react';
import type { ItemDefinition, Bundle, Team } from '@vcm/shared';
import { useShopItems } from '../../hooks/useItems';
import { useShopBundles } from '../../hooks/useBundles';
import { useTeams } from '../../hooks/useTeams';
import { usePosCheckout } from '../../hooks/usePos';

interface CartItem {
  type: 'item';
  itemDefinitionId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartBundle {
  type: 'bundle';
  bundleId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

type CartEntry = CartItem | CartBundle;

export function PosPage() {
  const { data: teams } = useTeams();
  const { data: items } = useShopItems();
  const { data: bundles } = useShopBundles();
  const posCheckout = usePosCheckout();

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);

  const selectedTeam = teams?.find((t) => t.id === selectedTeamId);

  const cartTotal = cart.reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0);

  const addItemToCart = (item: ItemDefinition) => {
    setCart((prev) => {
      const existing = prev.find(
        (e) => e.type === 'item' && (e as CartItem).itemDefinitionId === item.id,
      );
      if (existing) {
        return prev.map((e) =>
          e.type === 'item' && (e as CartItem).itemDefinitionId === item.id
            ? { ...e, quantity: e.quantity + 1 }
            : e,
        );
      }
      return [
        ...prev,
        {
          type: 'item' as const,
          itemDefinitionId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const addBundleToCart = (bundle: Bundle) => {
    setCart((prev) => {
      const existing = prev.find(
        (e) => e.type === 'bundle' && (e as CartBundle).bundleId === bundle.id,
      );
      if (existing) {
        return prev.map((e) =>
          e.type === 'bundle' && (e as CartBundle).bundleId === bundle.id
            ? { ...e, quantity: e.quantity + 1 }
            : e,
        );
      }
      return [
        ...prev,
        {
          type: 'bundle' as const,
          bundleId: bundle.id,
          name: bundle.name,
          unitPrice: bundle.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => prev.map((e, i) => (i === index ? { ...e, quantity: qty } : e)));
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setLastResult(null);
  };

  const handleCheckout = () => {
    if (!selectedTeamId || cart.length === 0) return;

    const itemEntries = cart.filter((e) => e.type === 'item') as CartItem[];
    const bundleEntries = cart.filter((e) => e.type === 'bundle') as CartBundle[];

    posCheckout.mutate(
      {
        teamId: selectedTeamId,
        items: itemEntries.map((e) => ({
          itemDefinitionId: e.itemDefinitionId,
          quantity: e.quantity,
        })),
        bundles: bundleEntries.map((e) => ({
          bundleId: e.bundleId,
          quantity: e.quantity,
        })),
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setCart([]);
        },
      },
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Point of Sale</h1>

      {/* Team Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Team
        </label>
        <select
          value={selectedTeamId}
          onChange={(e) => {
            setSelectedTeamId(e.target.value);
            setLastResult(null);
          }}
          className="w-full md:w-96 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Choose a team...</option>
          {teams?.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} (Budget: {team.budget.toLocaleString()})
            </option>
          ))}
        </select>
        {selectedTeam && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Owner: {selectedTeam.owner?.discordUsername ?? 'N/A'} | Budget:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {selectedTeam.budget.toLocaleString()}
            </span>
          </p>
        )}
      </div>

      {selectedTeamId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items?.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItemToCart(item)}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-3 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.name}</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                    )}
                  </button>
                ))}
                {items?.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No items available.</p>
                )}
              </div>
            </div>

            {/* Bundles */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Bundles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bundles?.map((bundle) => {
                  const individualTotal =
                    bundle.items?.reduce(
                      (sum, bi) => sum + (bi.itemDefinition?.price ?? 0) * bi.quantity,
                      0,
                    ) ?? 0;
                  const savings = individualTotal - bundle.price;

                  return (
                    <button
                      key={bundle.id}
                      onClick={() => addBundleToCart(bundle)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-3 text-left hover:shadow-md transition-shadow border-l-4 border-indigo-400"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {bundle.name}
                          </span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                            Bundle
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {bundle.price.toLocaleString()}
                        </span>
                      </div>
                      {savings > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Save {savings.toLocaleString()} vs buying individually
                        </p>
                      )}
                      <div className="mt-1">
                        {bundle.items?.map((bi) => (
                          <span
                            key={bi.id}
                            className="text-xs text-gray-500 dark:text-gray-400 mr-2"
                          >
                            {bi.itemDefinition?.name} x{bi.quantity}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
                {bundles?.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No bundles available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Cart</h2>

              {cart.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Click items or bundles to add them to the cart.
                </p>
              )}

              <div className="space-y-2 mb-4">
                {cart.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.name}
                        </span>
                        {entry.type === 'bundle' && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1 py-0.5 rounded">
                            B
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.unitPrice.toLocaleString()} each
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => updateQuantity(i, entry.quantity - 1)}
                        className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {entry.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(i, entry.quantity + 1)}
                        className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(i)}
                        className="text-red-500 hover:text-red-700 text-xs ml-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {cartTotal.toLocaleString()}
                  </span>
                </div>
                {selectedTeam && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Team budget:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedTeam.budget.toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedTeam && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                    <span
                      className={`font-medium ${
                        selectedTeam.budget - cartTotal >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {(selectedTeam.budget - cartTotal).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={
                    cart.length === 0 ||
                    posCheckout.isPending ||
                    (selectedTeam ? selectedTeam.budget < cartTotal : true)
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
                >
                  {posCheckout.isPending ? 'Processing...' : 'Checkout'}
                </button>
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>

              {posCheckout.isError && (
                <p className="mt-3 text-sm text-red-600">
                  {(posCheckout.error as any)?.response?.data?.message ??
                    'Checkout failed'}
                </p>
              )}

              {lastResult && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    Transaction complete
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Total charged: {lastResult.totalCost?.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Remaining budget: {lastResult.remainingBudget?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
