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

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!competition) return <p className="text-gray-500 dark:text-gray-400">Not found.</p>;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {competition.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Teams</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {competition.teams?.map((ct) => (
            <span
              key={ct.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-sm"
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schedule</h2>
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
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {round.name ?? `Round ${round.roundNumber}`}
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 divide-y dark:divide-gray-700">
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
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate text-right">
            {match.homeTeam?.name ?? 'TBD'}
          </span>

          {hasResult ? (
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 w-8 text-center shrink-0">
              {match.result!.homeScore} - {match.result!.awayScore}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 w-8 text-center shrink-0">vs</span>
          )}

          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate">
            {match.awayTeam?.name ?? 'TBD'}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-2 shrink-0">
          {match.scheduledAt && !showEditForm && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}

          {hasResult && match.result!.status !== 'CONFIRMED' && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                match.result!.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : match.result!.status === 'DISPUTED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}
            >
              {match.result!.status}
            </span>
          )}

          {canEdit && !showEditForm && (
            <>
              <button
                onClick={handleSwap}
                disabled={updateMatch.isPending}
                title="Swap home/away"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 disabled:opacity-50"
              >
                &#8646;
              </button>
              <button
                onClick={() => setShowEditForm(true)}
                title="Edit match"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600"
              >
                Edit
              </button>
            </>
          )}

          {canSubmit && !showForm && !showEditForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Submit Result
            </button>
          )}

          {hasResult && (
            <Link
              to={`/matches/${match.id}/stats`}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Stats
            </Link>
          )}
        </div>
      </div>

      {/* Edit form */}
      {showEditForm && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <label className="text-xs text-gray-500 dark:text-gray-400">Date/Time:</label>
          <input
            type="datetime-local"
            value={editScheduledAt}
            onChange={(e) => setEditScheduledAt(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            onClick={handleSaveSchedule}
            disabled={updateMatch.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
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
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
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
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear date
            </button>
          )}
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
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
          />
          <span className="text-gray-400 dark:text-gray-500">-</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
          />
          <button
            onClick={() => {
              submitResult.mutate(
                { homeScore, awayScore },
                { onSuccess: () => setShowForm(false) },
              );
            }}
            disabled={submitResult.isPending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
          >
            Submit
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
