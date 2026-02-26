import { Link } from 'react-router';
import type { TradeOffer } from '@vcm/shared';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DENIED: 'bg-red-100 text-red-800',
  COUNTERED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

interface TradeOfferCardProps {
  trade: TradeOffer;
}

export function TradeOfferCard({ trade }: TradeOfferCardProps) {
  return (
    <Link
      to={`/transfers/trades/${trade.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[trade.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {trade.status.replace(/_/g, ' ')}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(trade.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-gray-900">{trade.initTeam?.name ?? 'Unknown'}</p>
          <p className="text-xs text-gray-500">Initiating</p>
          {(trade.offeredPlayers?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {trade.offeredPlayers!.length} player{trade.offeredPlayers!.length !== 1 ? 's' : ''}
            </p>
          )}
          {trade.currencyOffered > 0 && (
            <p className="text-xs text-green-600">{trade.currencyOffered.toLocaleString()} currency</p>
          )}
        </div>

        <div className="text-gray-400 text-lg">&#8644;</div>

        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-gray-900">{trade.recvTeam?.name ?? 'Unknown'}</p>
          <p className="text-xs text-gray-500">Receiving</p>
          {(trade.requestedPlayers?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {trade.requestedPlayers!.length} player{trade.requestedPlayers!.length !== 1 ? 's' : ''}
            </p>
          )}
          {trade.currencyRequested > 0 && (
            <p className="text-xs text-green-600">{trade.currencyRequested.toLocaleString()} currency</p>
          )}
        </div>
      </div>

      {trade.note && (
        <p className="text-xs text-gray-500 mt-2 truncate">Note: {trade.note}</p>
      )}
    </Link>
  );
}
