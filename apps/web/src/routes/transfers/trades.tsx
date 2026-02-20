import { useState } from 'react';
import { useTrades } from '../../hooks/useTrades';
import { TradeOfferCard } from '../../components/transfers/TradeOfferCard';

const STATUSES = ['ALL', 'PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COUNTERED', 'DENIED', 'CANCELLED', 'EXPIRED'] as const;

export function TradesTab() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { data: trades, isLoading } = useTrades(
    statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
  );

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading trades...</p>
      ) : trades && trades.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trades.map((trade) => (
            <TradeOfferCard key={trade.id} trade={trade} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No trade offers found.</p>
      )}
    </div>
  );
}
