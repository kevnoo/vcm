import { Link } from 'react-router';
import type { Transaction } from '@vcm/shared';

const TYPE_LABELS: Record<string, string> = {
  TRADE: 'Trade',
  FREE_AGENCY: 'Free Agency',
  WAIVER_CLAIM: 'Waiver Claim',
  RELEASED: 'Released',
  WAIVER_CLEAR: 'Waiver Clear',
  ADMIN_ASSIGN: 'Admin Assign',
  ADMIN_RELEASE: 'Admin Release',
};

const TYPE_COLORS: Record<string, string> = {
  TRADE: 'bg-blue-100 text-blue-800',
  FREE_AGENCY: 'bg-green-100 text-green-800',
  WAIVER_CLAIM: 'bg-purple-100 text-purple-800',
  RELEASED: 'bg-red-100 text-red-800',
  WAIVER_CLEAR: 'bg-gray-100 text-gray-800',
  ADMIN_ASSIGN: 'bg-indigo-100 text-indigo-800',
  ADMIN_RELEASE: 'bg-orange-100 text-orange-800',
};

interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${TYPE_COLORS[transaction.type] ?? 'bg-gray-100 text-gray-800'}`}>
          {TYPE_LABELS[transaction.type] ?? transaction.type}
        </span>
        <Link
          to={`/players/${transaction.playerId}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {transaction.player
            ? `${transaction.player.firstName} ${transaction.player.lastName}`
            : 'Unknown Player'}
        </Link>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        {transaction.fromTeam && (
          <span>
            From:{' '}
            <Link to={`/teams/${transaction.fromTeam.id}`} className="text-indigo-600 hover:text-indigo-700">
              {transaction.fromTeam.name}
            </Link>
          </span>
        )}
        {transaction.toTeam && (
          <span>
            To:{' '}
            <Link to={`/teams/${transaction.toTeam.id}`} className="text-indigo-600 hover:text-indigo-700">
              {transaction.toTeam.name}
            </Link>
          </span>
        )}
        {transaction.currencyAmount != null && transaction.currencyAmount > 0 && (
          <span className="text-green-600">{transaction.currencyAmount.toLocaleString()}</span>
        )}
        <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
