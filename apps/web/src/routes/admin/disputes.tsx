import { useState } from 'react';
import { useDisputes, useResolveResult, useConfirmResult } from '../../hooks/useResults';

export function DisputesPage() {
  const { data: disputes, isLoading } = useDisputes();
  const resolveResult = useResolveResult();
  const confirmResult = useConfirmResult();

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading disputes...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Disputes</h1>

      {disputes?.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-12">No pending disputes.</p>
      )}

      <div className="space-y-4">
        {disputes?.map((result: any) => (
          <DisputeCard
            key={result.id}
            result={result}
            onResolve={(data) =>
              resolveResult.mutate({ id: result.id, ...data })
            }
            onConfirm={() => confirmResult.mutate(result.id)}
            isResolving={resolveResult.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function DisputeCard({
  result,
  onResolve,
  onConfirm,
  isResolving,
}: {
  result: any;
  onResolve: (data: {
    homeScore: number;
    awayScore: number;
    note?: string;
  }) => void;
  onConfirm: () => void;
  isResolving: boolean;
}) {
  const [showResolve, setShowResolve] = useState(false);
  const [homeScore, setHomeScore] = useState(result.homeScore);
  const [awayScore, setAwayScore] = useState(result.awayScore);
  const [note, setNote] = useState('');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {result.match?.round?.competition?.name} &middot;{' '}
            {result.match?.round?.name}
          </p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {result.match?.homeTeam?.name} {result.homeScore} -{' '}
            {result.awayScore} {result.match?.awayTeam?.name}
          </p>
        </div>
        <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs px-2 py-1 rounded">
          DISPUTED
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        <p>
          Submitted by: <strong>{result.submittedBy?.discordUsername}</strong>
        </p>
        <p>
          Disputed by: <strong>{result.disputedBy?.discordUsername}</strong>
        </p>
        {result.disputeReason && (
          <p className="mt-1 italic">"{result.disputeReason}"</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
        >
          Confirm Original
        </button>
        <button
          onClick={() => setShowResolve(!showResolve)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm"
        >
          Correct Score
        </button>
      </div>

      {showResolve && (
        <div className="mt-3 border-t pt-3 flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
          />
          <span className="text-gray-400 dark:text-gray-500">-</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
          />
          <input
            type="text"
            placeholder="Resolution note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm min-w-32"
          />
          <button
            onClick={() =>
              onResolve({ homeScore, awayScore, note: note || undefined })
            }
            disabled={isResolving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
          >
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}
