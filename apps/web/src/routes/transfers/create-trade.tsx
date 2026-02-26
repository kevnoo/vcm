import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTeams } from '../../hooks/useTeams';
import { usePlayers } from '../../hooks/usePlayers';
import { useCreateTradeOffer, useCounterTrade } from '../../hooks/useTrades';
import { useAuthStore } from '../../stores/auth.store';

export function CreateTradePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const counterId = searchParams.get('counterId');
  const preSelectedTeamId = searchParams.get('teamId');

  const { user } = useAuthStore();
  const { data: teams } = useTeams();
  const createTrade = useCreateTradeOffer();
  const counterTrade = useCounterTrade();

  const userTeam = teams?.find((t) => t.ownerId === user?.id);

  const [receivingTeamId, setReceivingTeamId] = useState(preSelectedTeamId ?? '');
  const [currencyOffered, setCurrencyOffered] = useState('0');
  const [currencyRequested, setCurrencyRequested] = useState('0');
  const [offeredPlayerIds, setOfferedPlayerIds] = useState<string[]>([]);
  const [requestedPlayerIds, setRequestedPlayerIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const { data: myPlayers } = usePlayers(userTeam ? { teamId: userTeam.id } : undefined);
  const { data: theirPlayers } = usePlayers(receivingTeamId ? { teamId: receivingTeamId } : undefined);

  const otherTeams = teams?.filter((t) => t.id !== userTeam?.id) ?? [];

  const togglePlayer = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmit = () => {
    if (!receivingTeamId) return;

    const data = {
      receivingTeamId,
      currencyOffered: parseInt(currencyOffered, 10) || 0,
      currencyRequested: parseInt(currencyRequested, 10) || 0,
      offeredPlayerIds: offeredPlayerIds.length > 0 ? offeredPlayerIds : undefined,
      requestedPlayerIds: requestedPlayerIds.length > 0 ? requestedPlayerIds : undefined,
      note: note || undefined,
    };

    if (counterId) {
      counterTrade.mutate(
        { id: counterId, ...data },
        { onSuccess: () => navigate('/transfers') },
      );
    } else {
      createTrade.mutate(data, { onSuccess: () => navigate('/transfers') });
    }
  };

  if (!userTeam) {
    return <p className="text-gray-500">You must own a team to create a trade offer.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {counterId ? 'Counter Trade Offer' : 'New Trade Offer'}
      </h1>

      {/* Receiving team selection */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Team</label>
          <select
            value={receivingTeamId}
            onChange={(e) => {
              setReceivingTeamId(e.target.value);
              setRequestedPlayerIds([]);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select team...</option>
            {otherTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency You Offer
            </label>
            <input
              type="number"
              value={currencyOffered}
              onChange={(e) => setCurrencyOffered(e.target.value)}
              min={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency You Request
            </label>
            <input
              type="number"
              value={currencyRequested}
              onChange={(e) => setCurrencyRequested(e.target.value)}
              min={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Players you offer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Players You Offer ({userTeam.name})
          </label>
          {myPlayers && myPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {myPlayers.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                    offeredPlayerIds.includes(p.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={offeredPlayerIds.includes(p.id)}
                    onChange={() => togglePlayer(p.id, offeredPlayerIds, setOfferedPlayerIds)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-xs text-gray-500">{p.primaryPosition}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No players on your team</p>
          )}
        </div>

        {/* Players you request */}
        {receivingTeamId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Players You Request
            </label>
            {theirPlayers && theirPlayers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {theirPlayers.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      requestedPlayerIds.includes(p.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={requestedPlayerIds.includes(p.id)}
                      onChange={() => togglePlayer(p.id, requestedPlayerIds, setRequestedPlayerIds)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-xs text-gray-500">{p.primaryPosition}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No players on this team</p>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!receivingTeamId || createTrade.isPending || counterTrade.isPending}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg"
        >
          {counterId ? 'Send Counter Offer' : 'Send Trade Offer'}
        </button>
      </div>
    </div>
  );
}
