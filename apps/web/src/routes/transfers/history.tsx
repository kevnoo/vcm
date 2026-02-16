import { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useTeams } from '../../hooks/useTeams';
import { TransactionRow } from '../../components/transfers/TransactionRow';

const TYPES = ['ALL', 'TRADE', 'FREE_AGENCY', 'WAIVER_CLAIM', 'RELEASED', 'WAIVER_CLEAR', 'ADMIN_ASSIGN', 'ADMIN_RELEASE'] as const;

export function HistoryTab() {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState('');
  const { data: teams } = useTeams();
  const { data: transactions, isLoading } = useTransactions({
    ...(typeFilter !== 'ALL' && { type: typeFilter }),
    ...(teamFilter && { teamId: teamFilter }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                typeFilter === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Teams</option>
          {teams?.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading transactions...</p>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No transactions found.</p>
      )}
    </div>
  );
}
