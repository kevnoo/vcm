import { useState } from 'react';
import type { Bundle, ItemDefinition, CreateBundleItemDto } from '@vcm/shared';
import {
  useAdminBundles,
  useCreateBundle,
  useUpdateBundle,
  useDeleteBundle,
} from '../../hooks/useBundles';
import { useAdminItems } from '../../hooks/useItems';

export function BundleManagementPage() {
  const { data: bundles, isLoading } = useAdminBundles();
  const { data: allItems } = useAdminItems();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newItems, setNewItems] = useState<CreateBundleItemDto[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');

  const [editing, setEditing] = useState<Bundle | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editItems, setEditItems] = useState<CreateBundleItemDto[]>([]);
  const [editSelectedItemId, setEditSelectedItemId] = useState('');
  const [editSelectedQty, setEditSelectedQty] = useState('1');

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  const getItemName = (itemDefId: string) =>
    allItems?.find((i) => i.id === itemDefId)?.name ?? itemDefId;

  const individualTotal = (items: CreateBundleItemDto[]) =>
    items.reduce((sum, bi) => {
      const def = allItems?.find((i) => i.id === bi.itemDefinitionId);
      return sum + (def?.price ?? 0) * bi.quantity;
    }, 0);

  const handleAddItem = () => {
    if (!selectedItemId) return;
    const qty = parseInt(selectedQty, 10) || 1;
    if (newItems.find((i) => i.itemDefinitionId === selectedItemId)) return;
    setNewItems([...newItems, { itemDefinitionId: selectedItemId, quantity: qty }]);
    setSelectedItemId('');
    setSelectedQty('1');
  };

  const handleRemoveItem = (itemDefId: string) => {
    setNewItems(newItems.filter((i) => i.itemDefinitionId !== itemDefId));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice || newItems.length < 2) return;
    createBundle.mutate(
      {
        name: newName.trim(),
        description: newDescription || undefined,
        price: parseInt(newPrice, 10),
        items: newItems,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewDescription('');
          setNewPrice('');
          setNewItems([]);
          setAdding(false);
        },
      },
    );
  };

  const handleEdit = (bundle: Bundle) => {
    setEditing(bundle);
    setEditName(bundle.name);
    setEditDescription(bundle.description ?? '');
    setEditPrice(String(bundle.price));
    setEditActive(bundle.isActive);
    setEditItems(
      bundle.items?.map((i) => ({
        itemDefinitionId: i.itemDefinitionId,
        quantity: i.quantity,
      })) ?? [],
    );
  };

  const handleEditAddItem = () => {
    if (!editSelectedItemId) return;
    const qty = parseInt(editSelectedQty, 10) || 1;
    if (editItems.find((i) => i.itemDefinitionId === editSelectedItemId)) return;
    setEditItems([...editItems, { itemDefinitionId: editSelectedItemId, quantity: qty }]);
    setEditSelectedItemId('');
    setEditSelectedQty('1');
  };

  const handleEditRemoveItem = (itemDefId: string) => {
    setEditItems(editItems.filter((i) => i.itemDefinitionId !== itemDefId));
  };

  const handleSave = () => {
    if (!editing || editItems.length < 2) return;
    updateBundle.mutate(
      {
        id: editing.id,
        name: editName,
        description: editDescription || undefined,
        price: parseInt(editPrice, 10),
        isActive: editActive,
        items: editItems,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleToggleActive = (bundle: Bundle) => {
    updateBundle.mutate({ id: bundle.id, isActive: !bundle.isActive });
  };

  const availableForNew = allItems?.filter(
    (i) => !newItems.find((ni) => ni.itemDefinitionId === i.id),
  );

  const availableForEdit = allItems?.filter(
    (i) => !editItems.find((ei) => ei.itemDefinitionId === i.id),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bundle Management</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Create Bundle
          </button>
        )}
      </div>

      {/* Add Form */}
      {adding && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 mb-6 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">New Bundle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Bundle name"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Bundle price"
              min={0}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              Individual total: {individualTotal(newItems).toLocaleString()}
              {newPrice && individualTotal(newItems) > parseInt(newPrice, 10) && (
                <span className="ml-2 text-green-600 font-medium">
                  (Save {(individualTotal(newItems) - parseInt(newPrice, 10)).toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Item picker */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Items in bundle ({newItems.length}/min 2):
            </p>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select an item to add</option>
                {availableForNew?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.price.toLocaleString()})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={selectedQty}
                onChange={(e) => setSelectedQty(e.target.value)}
                min={1}
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedItemId}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm"
              >
                Add
              </button>
            </div>
            {newItems.map((bi) => (
              <div
                key={bi.itemDefinitionId}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded mb-1 text-sm"
              >
                <span>
                  {getItemName(bi.itemDefinitionId)} x{bi.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(bi.itemDefinitionId)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createBundle.isPending || newItems.length < 2}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewItems([]);
              }}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          {createBundle.isError && (
            <p className="text-sm text-red-600">
              {(createBundle.error as any)?.response?.data?.message ?? 'Failed to create bundle'}
            </p>
          )}
        </form>
      )}

      {/* Bundles List */}
      <div className="space-y-3">
        {bundles?.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No bundles created yet.</p>
        )}
        {bundles?.map((bundle) => (
          <div key={bundle.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4">
            {editing?.id === bundle.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    min={0}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="rounded"
                    />
                    Active
                  </label>
                </div>

                {/* Edit item picker */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Items ({editItems.length}/min 2):
                  </p>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={editSelectedItemId}
                      onChange={(e) => setEditSelectedItemId(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select an item to add</option>
                      {availableForEdit?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editSelectedQty}
                      onChange={(e) => setEditSelectedQty(e.target.value)}
                      min={1}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleEditAddItem}
                      disabled={!editSelectedItemId}
                      className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {editItems.map((bi) => (
                    <div
                      key={bi.itemDefinitionId}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded mb-1 text-sm"
                    >
                      <span>
                        {getItemName(bi.itemDefinitionId)} x{bi.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditRemoveItem(bi.itemDefinitionId)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={editItems.length < 2}
                    className="text-xs bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{bundle.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          bundle.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{bundle.description}</p>
                    )}
                    <div className="flex gap-4 mt-1 text-xs text-gray-400 dark:text-gray-500">
                      <span>Price: {bundle.price.toLocaleString()}</span>
                      <span>Items: {bundle.items?.length ?? 0}</span>
                      {bundle.items && (
                        <span>
                          Individual: {individualTotal(
                            bundle.items.map((i) => ({
                              itemDefinitionId: i.itemDefinitionId,
                              quantity: i.quantity,
                            })),
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(bundle)}
                      className={`text-xs px-2 py-1 rounded ${
                        bundle.isActive
                          ? 'text-yellow-600 hover:text-yellow-700'
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      {bundle.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(bundle)}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete bundle "${bundle.name}"?`))
                          deleteBundle.mutate(bundle.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {/* Bundle contents */}
                {bundle.items && bundle.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {bundle.items.map((bi) => (
                      <span
                        key={bi.id}
                        className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded"
                      >
                        {bi.itemDefinition?.name ?? bi.itemDefinitionId} x{bi.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
