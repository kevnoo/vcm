import { Link } from 'react-router';
import type { TradeOffer } from '@vcm/shared';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  DENIED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  COUNTERED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

interface TradeOfferCardProps {
  trade: TradeOffer;
}

export function TradeOfferCard({ trade }: TradeOfferCardProps) {
  return (
    <Link
      to={`/transfers/trades/${trade.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[trade.status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
          {trade.status.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(trade.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{trade.initTeam?.name ?? 'Unknown'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Initiating</p>
          {(trade.offeredPlayers?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {trade.offeredPlayers!.length} player{trade.offeredPlayers!.length !== 1 ? 's' : ''}
            </p>
          )}
          {trade.currencyOffered > 0 && (
            <p className="text-xs text-green-600">{trade.currencyOffered.toLocaleString()} currency</p>
          )}
        </div>

        <div className="text-gray-400 dark:text-gray-500 text-lg">&#8644;</div>

        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{trade.recvTeam?.name ?? 'Unknown'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Receiving</p>
          {(trade.requestedPlayers?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {trade.requestedPlayers!.length} player{trade.requestedPlayers!.length !== 1 ? 's' : ''}
            </p>
          )}
          {trade.currencyRequested > 0 && (
            <p className="text-xs text-green-600">{trade.currencyRequested.toLocaleString()} currency</p>
          )}
        </div>
      </div>

      {trade.note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">Note: {trade.note}</p>
      )}
    </Link>
  );
}
