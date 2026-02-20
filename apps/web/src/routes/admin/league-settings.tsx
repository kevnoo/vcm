import { useState } from 'react';
import { useLeagueSettings, useUpsertLeagueSetting, useDeleteLeagueSetting } from '../../hooks/useLeagueSettings';

export function LeagueSettingsPage() {
  const { data: settings, isLoading } = useLeagueSettings();
  const upsertSetting = useUpsertLeagueSetting();
  const deleteSetting = useDeleteLeagueSetting();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingKey) return;
    upsertSetting.mutate(
      { key: editingKey, value: editValue },
      { onSuccess: () => setEditingKey(null) },
    );
  };

  const addNew = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    upsertSetting.mutate(
      { key: newKey.trim(), value: newValue.trim() },
      {
        onSuccess: () => {
          setNewKey('');
          setNewValue('');
        },
      },
    );
  };

  const handleDelete = (key: string) => {
    if (!confirm(`Delete setting "${key}"?`)) return;
    deleteSetting.mutate(key);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">League Settings</h1>

      {/* Existing settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Settings</h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
          ) : settings && settings.length > 0 ? (
            <div className="space-y-3">
              {settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">{setting.key}</span>
                    {editingKey === setting.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{setting.value}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingKey === setting.key ? (
                      <>
                        <button
                          onClick={saveEdit}
                          disabled={upsertSetting.isPending}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(setting.key, setting.value)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(setting.key)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No settings configured.</p>
          )}
        </div>
      </div>

      {/* Add new setting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Add Setting</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addNew}
            disabled={upsertSetting.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
