interface TradeBalanceBarProps {
  offeredValue: number;
  requestedValue: number;
}

export function TradeBalanceBar({ offeredValue, requestedValue }: TradeBalanceBarProps) {
  const total = offeredValue + requestedValue;
  if (total === 0) return null;

  const offeredPercent = Math.round((offeredValue / total) * 100);
  const requestedPercent = 100 - offeredPercent;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>Offered: {offeredValue.toLocaleString()}</span>
        <span>Requested: {requestedValue.toLocaleString()}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${offeredPercent}%` }}
        />
        <div
          className="bg-orange-500 transition-all"
          style={{ width: `${requestedPercent}%` }}
        />
      </div>
    </div>
  );
}
