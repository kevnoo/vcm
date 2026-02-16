import { useState } from 'react';
import { Link } from 'react-router';
import { useWaivers, usePlaceWaiverBid, useResolveWaiver, useCancelWaiver } from '../../hooks/useWaivers';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import { WaiverCountdown } from '../../components/transfers/WaiverCountdown';
import type { WaiverBid } from '@vcm/shared';

export function WaiversTab() {
  const { data: waivers, isLoading } = useWaivers();
  const { user, isAdmin } = useAuthStore();
  const { data: teams } = useTeams();
  const placeBid = usePlaceWaiverBid();
  const resolveWaiver = useResolveWaiver();
  const cancelWaiver = useCancelWaiver();

  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const userTeam = teams?.find((t) => t.ownerId === user?.id);

  const handleBid = (waiverWireId: string) => {
    const amount = parseInt(bidAmounts[waiverWireId] ?? '0', 10);
    if (amount <= 0) return;
    placeBid.mutate({ waiverWireId, amount });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-gray-500">Loading waivers...</p>
      ) : waivers && waivers.length > 0 ? (
        <div className="grid gap-4">
          {waivers.map((waiver) => (
            <div key={waiver.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/players/${waiver.playerId}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {waiver.player
                      ? `${waiver.player.firstName} ${waiver.player.lastName}`
                      : 'Unknown Player'}
                  </Link>
                  {waiver.player && (
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                      {waiver.player.primaryPosition}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <WaiverCountdown expiresAt={waiver.expiresAt} />
                  <span className="text-xs text-gray-500">
                    {waiver.bids?.length ?? 0} bid{(waiver.bids?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {waiver.releasedFrom && (
                <p className="text-xs text-gray-500 mb-2">
                  Released from: {waiver.releasedFrom.name}
                </p>
              )}

              {/* Bid form for team owners */}
              {userTeam && waiver.releasedFromId !== userTeam.id && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <input
                    type="number"
                    value={bidAmounts[waiver.id] ?? ''}
                    onChange={(e) =>
                      setBidAmounts((prev) => ({ ...prev, [waiver.id]: e.target.value }))
                    }
                    placeholder="Bid amount"
                    min={1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                  />
                  <button
                    onClick={() => handleBid(waiver.id)}
                    disabled={placeBid.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
                  >
                    Place Bid
                  </button>
                </div>
              )}

              {/* Admin actions */}
              {isAdmin() && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => resolveWaiver.mutate(waiver.id)}
                    disabled={resolveWaiver.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => cancelWaiver.mutate(waiver.id)}
                    disabled={cancelWaiver.isPending}
                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
                  >
                    Cancel
                  </button>
                  {/* Show all bids for admin */}
                  {waiver.bids && waiver.bids.length > 0 && (
                    <div className="ml-auto flex gap-2">
                      {waiver.bids.map((bid: WaiverBid) => (
                        <span key={bid.id} className="text-xs text-gray-500">
                          {bid.team?.name}: {bid.amount.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No active waivers.</p>
      )}
    </div>
  );
}
