import { useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  useCompetition,
  useAddTeams,
  useGenerateSchedule,
  useActivateCompetition,
} from '../../hooks/useCompetitions';
import { useTeams } from '../../hooks/useTeams';
import { useAuthStore } from '../../stores/auth.store';
import { useSubmitResult } from '../../hooks/useResults';
import { useUpdateMatch } from '../../hooks/useMatches';
import type { Match, Round } from '@vcm/shared';
import { downloadCSV } from '../../lib/export-csv';

export function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: competition, isLoading } = useCompetition(id!);
  const { data: allTeams } = useTeams();
  const addTeams = useAddTeams(id!);
  const generateSchedule = useGenerateSchedule(id!);
  const activate = useActivateCompetition(id!);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!competition) return <p className="text-gray-500">Not found.</p>;

  const existingTeamIds = new Set(competition.teams?.map((ct) => ct.teamId));
  const availableTeams =
    allTeams?.filter((t) => !existingTeamIds.has(t.id)) ?? [];

  const isDraft = competition.status === 'DRAFT';
  const hasSchedule = (competition.rounds?.length ?? 0) > 0;

  const exportCSV = () => {
    if (!competition.rounds) return;
    const rows: string[][] = [['Round', 'Match #', 'Home', 'Away']];
    let matchNum = 1;
    for (const round of competition.rounds) {
      for (const match of round.matches ?? []) {
        rows.push([
          round.name ?? `Round ${round.roundNumber}`,
          String(matchNum++),
          match.homeTeam?.name ?? 'TBD',
          match.awayTeam?.name ?? 'TBD',
        ]);
      }
    }
    downloadCSV(`${competition.name.replace(/\s+/g, '-').toLowerCase()}-schedule.csv`, rows);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {competition.name}
          </h1>
          <p className="text-gray-500">
            {competition.type.replace(/_/g, ' ')} &middot; {competition.status}
          </p>
        </div>

        {isAdmin() && isDraft && (
          <div className="flex gap-2">
            {(competition.teams?.length ?? 0) >= 2 && (
              <button
                onClick={() => generateSchedule.mutate()}
                disabled={generateSchedule.isPending}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {generateSchedule.isPending
                  ? 'Generating...'
                  : hasSchedule
                    ? 'Regenerate Schedule'
                    : 'Generate Schedule'}
              </button>
            )}
            {hasSchedule && (
              <button
                onClick={() => activate.mutate()}
                disabled={activate.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {activate.isPending ? 'Activating...' : 'Activate Competition'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Teams section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Teams</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {competition.teams?.map((ct) => (
            <span
              key={ct.id}
              className="bg-white border border-gray-200 rounded-full px-3 py-1 text-sm"
            >
              {ct.team?.name}
            </span>
          ))}
        </div>

        {isAdmin() && isDraft && availableTeams.length > 0 && (
          <div className="flex gap-2 items-end">
            <select
              multiple
              value={selectedTeamIds}
              onChange={(e) =>
                setSelectedTeamIds(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full sm:w-auto"
            >
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedTeamIds.length > 0) {
                  addTeams.mutate(
                    { teamIds: selectedTeamIds },
                    { onSuccess: () => setSelectedTeamIds([]) },
                  );
                }
              }}
              disabled={addTeams.isPending || selectedTeamIds.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add Teams
            </button>
          </div>
        )}
      </section>

      {/* Schedule section */}
      {hasSchedule && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
            <button
              onClick={exportCSV}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Export to CSV
            </button>
          </div>
          {competition.rounds?.map((round) => (
            <RoundSection
              key={round.id}
              round={round}
              competitionId={id!}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function RoundSection({
  round,
  competitionId,
}: {
  round: Round;
  competitionId: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">
        {round.name ?? `Round ${round.roundNumber}`}
      </h3>
      <div className="bg-white rounded-lg shadow divide-y">
        {round.matches?.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            competitionId={competitionId}
          />
        ))}
      </div>
    </div>
  );
}

function MatchRow({
  match,
  competitionId,
}: {
  match: Match;
  competitionId: string;
}) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [editScheduledAt, setEditScheduledAt] = useState(
    match.scheduledAt ? match.scheduledAt.slice(0, 16) : '',
  );
  const submitResult = useSubmitResult(match.id);
  const updateMatch = useUpdateMatch(match.id, competitionId);

  const hasResult = !!match.result;
  const canSubmit =
    !hasResult &&
    (isAdmin() ||
      user?.id === match.homeTeam?.owner?.id ||
      user?.id === match.awayTeam?.owner?.id);
  const canEdit = isAdmin() && !hasResult && match.status !== 'COMPLETED';

  const handleSwap = () => {
    updateMatch.mutate({
      homeTeamId: match.awayTeamId,
      awayTeamId: match.homeTeamId,
    });
  };

  const handleSaveSchedule = () => {
    updateMatch.mutate(
      { scheduledAt: editScheduledAt || null },
      { onSuccess: () => setShowEditForm(false) },
    );
  };

  return (
    <div className="px-3 py-3 sm:px-4">
      {/* Match teams & score row */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate text-right">
            {match.homeTeam?.name ?? 'TBD'}
          </span>

          {hasResult ? (
            <span className="text-base sm:text-lg font-bold text-gray-900 w-12 text-center shrink-0">
              {match.result!.homeScore} - {match.result!.awayScore}
            </span>
          ) : (
            <span className="text-sm text-gray-400 w-8 text-center shrink-0">vs</span>
          )}

          <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
            {match.awayTeam?.name ?? 'TBD'}
          </span>
        </div>

        {/* Status badge - inline on desktop, below on narrow mobile */}
        {hasResult && match.result!.status !== 'CONFIRMED' && (
          <span
            className={`text-xs px-2 py-0.5 rounded shrink-0 ${
              match.result!.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : match.result!.status === 'DISPUTED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {match.result!.status}
          </span>
        )}
      </div>

      {/* Meta row: date + action links */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="text-xs text-gray-400">
          {match.scheduledAt && !showEditForm && (
            <span>
              {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-2">
          {canEdit && !showEditForm && (
            <>
              <button
                onClick={handleSwap}
                disabled={updateMatch.isPending}
                title="Swap home/away"
                className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-50 p-1"
              >
                &#8646;
              </button>
              <button
                onClick={() => setShowEditForm(true)}
                title="Edit match"
                className="text-xs text-gray-400 hover:text-indigo-600 p-1"
              >
                Edit
              </button>
            </>
          )}

          {canSubmit && !showForm && !showEditForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 p-1"
            >
              Submit
            </button>
          )}

          <Link
            to={`/matches/${match.id}`}
            className="text-xs text-indigo-600 hover:text-indigo-800 p-1"
          >
            View
          </Link>

          {hasResult && (
            <Link
              to={`/matches/${match.id}/stats`}
              className="text-xs text-indigo-600 hover:text-indigo-800 p-1"
            >
              Stats
            </Link>
          )}
        </div>
      </div>

      {/* Edit form */}
      {showEditForm && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
          <label className="text-xs text-gray-500">Date/Time:</label>
          <input
            type="datetime-local"
            value={editScheduledAt}
            onChange={(e) => setEditScheduledAt(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm w-full sm:w-auto"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveSchedule}
              disabled={updateMatch.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditScheduledAt(
                  match.scheduledAt ? match.scheduledAt.slice(0, 16) : '',
                );
                setShowEditForm(false);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm py-1.5"
            >
              Cancel
            </button>
            {editScheduledAt && (
              <button
                onClick={() => {
                  setEditScheduledAt('');
                  updateMatch.mutate(
                    { scheduledAt: null },
                    { onSuccess: () => setShowEditForm(false) },
                  );
                }}
                disabled={updateMatch.isPending}
                className="text-xs text-red-500 hover:text-red-700 py-1.5"
              >
                Clear date
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit result form */}
      {showForm && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
          />
          <button
            onClick={() => {
              submitResult.mutate(
                { homeScore, awayScore },
                { onSuccess: () => setShowForm(false) },
              );
            }}
            disabled={submitResult.isPending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
          >
            Submit
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-sm py-1.5"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
