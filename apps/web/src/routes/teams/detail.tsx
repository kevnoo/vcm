import { useParams, Link } from 'react-router';
import { useTeam } from '../../hooks/useTeams';
import { usePlayers } from '../../hooks/usePlayers';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading } = useTeam(id!);
  const { data: players, isLoading: playersLoading } = usePlayers({ teamId: id });

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!team) return <p className="text-gray-500">Team not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
            {team.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-500">
            Owner: {team.owner?.discordUsername ?? 'None'}
          </p>
        </div>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Roster</h2>
        </div>
        <div className="p-4">
          {playersLoading ? (
            <p className="text-gray-500 text-sm">Loading roster...</p>
          ) : players && players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player) => (
                <Link
                  key={player.id}
                  to={`/players/${player.id}`}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {player.imageUrl ? (
                      <img
                        src={player.imageUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                        {player.firstName.charAt(0)}
                        {player.lastName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                      {player.primaryPosition}
                    </span>
                    <span className="text-xs text-gray-500">Age {player.age}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No players on this team.</p>
          )}
        </div>
      </div>
    </div>
  );
}
