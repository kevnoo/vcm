import { usePendingTrades } from '../../hooks/useTrades';
import { TradeOfferCard } from '../../components/transfers/TradeOfferCard';

export function PendingTradesPage() {
  const { data: trades, isLoading } = usePendingTrades();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending Trade Approvals</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : trades && trades.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trades.map((trade) => (
            <TradeOfferCard key={trade.id} trade={trade} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No trades awaiting approval.</p>
      )}
    </div>
  );
}
