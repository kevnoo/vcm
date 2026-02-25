import { useState } from 'react';
import {
  useStatDelegates,
  useAddStatDelegate,
  useRemoveStatDelegate,
} from '../../hooks/useStatDelegates';

interface StatDelegateManagerProps {
  teamId: string;
}

export function StatDelegateManager({ teamId }: StatDelegateManagerProps) {
  const { data: delegates, isLoading } = useStatDelegates(teamId);
  const addDelegate = useAddStatDelegate(teamId);
  const removeDelegate = useRemoveStatDelegate(teamId);
  const [newUserId, setNewUserId] = useState('');

  const handleAdd = () => {
    const userId = newUserId.trim();
    if (!userId) return;
    addDelegate.mutate(
      { delegateUserId: userId },
      {
        onSuccess: () => setNewUserId(''),
      },
    );
  };

  const handleRemove = (userId: string) => {
    removeDelegate.mutate(userId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Stat Entry Delegates</h3>
      <p className="text-xs text-gray-500 mb-4">
        Delegates can submit and manage game stats on behalf of your team.
      </p>

      {/* Delegate list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading delegates...</p>
      ) : delegates && delegates.length > 0 ? (
        <div className="space-y-2 mb-4">
          {delegates.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate block sm:inline">
                  {d.delegate?.discordUsername ?? d.delegateUserId}
                </span>
                <span className="text-xs text-gray-400 sm:ml-2 block sm:inline">
                  Added {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => handleRemove(d.delegateUserId)}
                disabled={removeDelegate.isPending}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic mb-4">No delegates added yet.</p>
      )}

      {/* Add delegate */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          placeholder="User ID"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={addDelegate.isPending || !newUserId.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
        >
          {addDelegate.isPending ? 'Adding...' : 'Add'}
        </button>
      </div>
      {addDelegate.isError && (
        <p className="text-sm text-red-600 mt-2">Failed to add delegate. Please check the user ID and try again.</p>
      )}
    </div>
  );
}
