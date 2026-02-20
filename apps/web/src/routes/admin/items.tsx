import { useState } from 'react';
import { ItemEffectType } from '@vcm/shared';
import type { ItemDefinition } from '@vcm/shared';
import {
  useAdminItems,
  useCreateItemDefinition,
  useUpdateItemDefinition,
  useDeleteItemDefinition,
} from '../../hooks/useItems';

const EFFECT_TYPES = Object.values(ItemEffectType);

const EFFECT_TYPE_LABELS: Record<string, string> = {
  BOOST_OVERALL: '+N Overall',
  BOOST_WEAK_FOOT: '+N Weak Foot',
  BOOST_POTENTIAL: '+N Potential',
  SET_OVERALL: 'Set Overall To',
};

export function ItemManagementPage() {
  const { data: items, isLoading } = useAdminItems();
  const createItem = useCreateItemDefinition();
  const updateItem = useUpdateItemDefinition();
  const deleteItem = useDeleteItemDefinition();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEffectType, setNewEffectType] = useState<ItemEffectType | ''>('');
  const [newEffectValue, setNewEffectValue] = useState('1');
  const [newPrice, setNewPrice] = useState('');

  const [editing, setEditing] = useState<ItemDefinition | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEffectType, setEditEffectType] = useState<ItemEffectType | ''>('');
  const [editEffectValue, setEditEffectValue] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editActive, setEditActive] = useState(true);

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEffectType || !newPrice) return;
    createItem.mutate(
      {
        name: newName.trim(),
        description: newDescription || undefined,
        effectType: newEffectType,
        effectValue: parseInt(newEffectValue, 10),
        price: parseInt(newPrice, 10),
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewDescription('');
          setNewEffectType('');
          setNewEffectValue('1');
          setNewPrice('');
          setAdding(false);
        },
      },
    );
  };

  const handleEdit = (item: ItemDefinition) => {
    setEditing(item);
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setEditEffectType(item.effectType);
    setEditEffectValue(String(item.effectValue));
    setEditPrice(String(item.price));
    setEditActive(item.isActive);
  };

  const handleSave = () => {
    if (!editing || !editEffectType) return;
    updateItem.mutate(
      {
        id: editing.id,
        name: editName,
        description: editDescription || undefined,
        effectType: editEffectType,
        effectValue: parseInt(editEffectValue, 10),
        price: parseInt(editPrice, 10),
        isActive: editActive,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleToggleActive = (item: ItemDefinition) => {
    updateItem.mutate({ id: item.id, isActive: !item.isActive });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Item Management</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Create Item
          </button>
        )}
      </div>

      {/* Add Form */}
      {adding && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 mb-6 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name (e.g., +1 Overall Boost)"
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
            <select
              value={newEffectType}
              onChange={(e) => setNewEffectType(e.target.value as ItemEffectType)}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select effect type</option>
              {EFFECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EFFECT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newEffectValue}
              onChange={(e) => setNewEffectValue(e.target.value)}
              placeholder="Effect value"
              min={1}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price"
              min={0}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createItem.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items?.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No items created yet.</p>
        )}
        {items?.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4">
            {editing?.id === item.id ? (
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
                  <select
                    value={editEffectType}
                    onChange={(e) => setEditEffectType(e.target.value as ItemEffectType)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {EFFECT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EFFECT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={editEffectValue}
                    onChange={(e) => setEditEffectValue(e.target.value)}
                    min={1}
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
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded"
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-gray-400 dark:text-gray-500">
                    <span>Effect: {EFFECT_TYPE_LABELS[item.effectType]} ({item.effectValue})</span>
                    <span>Price: {item.price.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`text-xs px-2 py-1 rounded ${
                      item.isActive
                        ? 'text-yellow-600 hover:text-yellow-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete item "${item.name}"?`))
                        deleteItem.mutate(item.id);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
