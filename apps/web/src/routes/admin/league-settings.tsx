import { useState, useEffect } from 'react';
import { useLeagueSettings, useUpsertLeagueSetting, useDeleteLeagueSetting } from '../../hooks/useLeagueSettings';

const WEBHOOK_KEYS = [
  {
    key: 'discord_webhook_results',
    label: 'Results Webhook',
    description: 'Sends notifications when match results are submitted or confirmed.',
  },
  {
    key: 'discord_webhook_transactions',
    label: 'Transactions Webhook',
    description: 'Sends notifications for trades, waivers, and free agency moves.',
  },
  {
    key: 'discord_webhook_admin',
    label: 'Admin Webhook',
    description: 'Sends notifications for disputes and admin alerts.',
  },
] as const;

function WebhookField({
  label,
  description,
  settingKey,
  currentValue,
  onSave,
  isPending,
}: {
  label: string;
  description: string;
  settingKey: string;
  currentValue: string;
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState(currentValue);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(currentValue);
    setDirty(false);
  }, [currentValue]);

  const handleChange = (v: string) => {
    setValue(v);
    setDirty(v !== currentValue);
  };

  const handleSave = () => {
    onSave(settingKey, value.trim());
    setDirty(false);
  };

  const isConfigured = !!currentValue;

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{label}</span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isConfigured ? 'Active' : 'Not Set'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function LeagueSettingsPage() {
  const { data: settings, isLoading } = useLeagueSettings();
  const upsertSetting = useUpsertLeagueSetting();
  const deleteSetting = useDeleteLeagueSetting();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const webhookKeySet = new Set(WEBHOOK_KEYS.map((w) => w.key));
  const otherSettings = settings?.filter((s) => !webhookKeySet.has(s.key)) ?? [];

  const getSettingValue = (key: string) =>
    settings?.find((s) => s.key === key)?.value ?? '';

  const handleWebhookSave = (key: string, value: string) => {
    if (!value) {
      deleteSetting.mutate(key);
    } else {
      upsertSetting.mutate({ key, value });
    }
  };

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
      <h1 className="text-2xl font-bold text-gray-900">League Settings</h1>

      {/* Discord Webhooks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Discord Webhooks</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure Discord webhook URLs for automated league notifications. Create webhooks in your Discord server's channel settings under Integrations.
          </p>
        </div>
        <div className="p-4 divide-y divide-gray-100">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : (
            WEBHOOK_KEYS.map((wh) => (
              <WebhookField
                key={wh.key}
                label={wh.label}
                description={wh.description}
                settingKey={wh.key}
                currentValue={getSettingValue(wh.key)}
                onSave={handleWebhookSave}
                isPending={upsertSetting.isPending || deleteSetting.isPending}
              />
            ))
          )}
        </div>
      </div>

      {/* Other settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Current Settings</h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : otherSettings.length > 0 ? (
            <div className="space-y-3">
              {otherSettings.map((setting) => (
                <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5 px-3 bg-gray-50 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-900 font-mono truncate">{setting.key}</span>
                    {editingKey === setting.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-600 break-all">{setting.value}</span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
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
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
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
            <p className="text-gray-500 text-sm">No other settings configured.</p>
          )}
        </div>
      </div>

      {/* Add new setting */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Add Setting</h3>
        <div className="flex flex-col sm:flex-row gap-3">
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg w-full sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
