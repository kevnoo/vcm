import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTradeOffer, useAcceptTrade, useRejectTrade, useCancelTrade, useApproveTrade, useDenyTrade } from '../../hooks/useTrades';
import { useAuthStore } from '../../stores/auth.store';
import { useTeams } from '../../hooks/useTeams';
import type { TradeOfferPlayer } from '@vcm/shared';

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

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: trade, isLoading } = useTradeOffer(id!);
  const { user, isAdmin } = useAuthStore();
  const { data: teams } = useTeams();
  const acceptTrade = useAcceptTrade();
  const rejectTrade = useRejectTrade();
  const cancelTrade = useCancelTrade();
  const approveTrade = useApproveTrade();
  const denyTrade = useDenyTrade();
  const [noteInput, setNoteInput] = useState('');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!trade) return <p className="text-gray-500">Trade not found.</p>;

  const userTeam = teams?.find((t) => t.ownerId === user?.id);
  const isInitiatingOwner = userTeam?.id === trade.initiatingTeamId;
  const isReceivingOwner = userTeam?.id === trade.receivingTeamId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/transfers" className="text-indigo-600 hover:text-indigo-700 text-sm">&larr; Back to Transfers</Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Trade Offer</h1>
          <span className={`text-sm font-medium px-3 py-1 rounded ${STATUS_COLORS[trade.status] ?? 'bg-gray-100 text-gray-800'}`}>
            {trade.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Initiating team side */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {trade.initTeam?.name ?? 'Unknown'} offers:
            </h3>
            {trade.offeredPlayers && trade.offeredPlayers.length > 0 ? (
              <ul className="space-y-1">
                {trade.offeredPlayers.map((tp: TradeOfferPlayer) => (
                  <li key={tp.id}>
                    <Link to={`/players/${tp.playerId}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                      {tp.player ? `${tp.player.firstName} ${tp.player.lastName}` : tp.playerId}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No players offered</p>
            )}
            {trade.currencyOffered > 0 && (
              <p className="text-sm text-green-600 mt-2">{trade.currencyOffered.toLocaleString()} currency</p>
            )}
          </div>

          {/* Receiving team side */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {trade.recvTeam?.name ?? 'Unknown'} offers:
            </h3>
            {trade.requestedPlayers && trade.requestedPlayers.length > 0 ? (
              <ul className="space-y-1">
                {trade.requestedPlayers.map((tp: TradeOfferPlayer) => (
                  <li key={tp.id}>
                    <Link to={`/players/${tp.playerId}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                      {tp.player ? `${tp.player.firstName} ${tp.player.lastName}` : tp.playerId}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No players requested</p>
            )}
            {trade.currencyRequested > 0 && (
              <p className="text-sm text-green-600 mt-2">{trade.currencyRequested.toLocaleString()} currency</p>
            )}
          </div>
        </div>

        {/* Notes */}
        {trade.note && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Note</p>
            <p className="text-sm text-gray-700">{trade.note}</p>
          </div>
        )}
        {trade.responseNote && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Response</p>
            <p className="text-sm text-gray-700">{trade.responseNote}</p>
          </div>
        )}
        {trade.adminNote && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Admin Note</p>
            <p className="text-sm text-gray-700">{trade.adminNote}</p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-400">
          Created: {new Date(trade.createdAt).toLocaleString()}
          {trade.expiresAt && <> &middot; Expires: {new Date(trade.expiresAt).toLocaleString()}</>}
        </div>
      </div>

      {/* Actions */}
      {(trade.status === 'PENDING' && (isReceivingOwner || isInitiatingOwner)) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Optional note..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            {isReceivingOwner && (
              <>
                <button
                  onClick={() => acceptTrade.mutate({ id: trade.id, responseNote: noteInput || undefined })}
                  disabled={acceptTrade.isPending}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => rejectTrade.mutate({ id: trade.id, responseNote: noteInput || undefined })}
                  disabled={rejectTrade.isPending}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
                >
                  Reject
                </button>
                <Link
                  to={`/transfers/create-trade?counterId=${trade.id}&teamId=${trade.initiatingTeamId}`}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded"
                >
                  Counter
                </Link>
              </>
            )}
            {isInitiatingOwner && (
              <button
                onClick={() => cancelTrade.mutate(trade.id)}
                disabled={cancelTrade.isPending}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                Cancel / Withdraw
              </button>
            )}
          </div>
        </div>
      )}

      {/* Admin actions */}
      {trade.status === 'PENDING_APPROVAL' && isAdmin() && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Admin Review</h3>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Admin note..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => approveTrade.mutate({ id: trade.id, adminNote: noteInput || undefined })}
              disabled={approveTrade.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
            >
              Approve & Execute
            </button>
            <button
              onClick={() => denyTrade.mutate({ id: trade.id, adminNote: noteInput || undefined })}
              disabled={denyTrade.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
