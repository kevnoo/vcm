import { useParams } from 'react-router';
import { useTeam } from '../../hooks/useTeams';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading } = useTeam(id!);

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
    </div>
  );
}
