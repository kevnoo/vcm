import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';
import {
  useMatchHub,
  useSendMessage,
  useProposeTime,
  useRespondToProposal,
  useAdminSetTime,
} from '../../hooks/useMatchScheduling';
import { useSubmitResult, useDisputeResult, useConfirmResult } from '../../hooks/useResults';
import { useMatchGameStats } from '../../hooks/usePlayerGameStats';
import { useMatchStats } from '../../hooks/useGameStats';
import { GameStatsEntryForm } from '../../components/game-stats/GameStatsEntryForm';
import { GameStatsReview } from '../../components/game-stats/GameStatsReview';
import type { MatchMessage, TimeProposal, MatchHub } from '@vcm/shared';

export function MatchHubPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: hub, isLoading } = useMatchHub(matchId!);
  const user = useAuthStore((s) => s.user);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!hub || !hub.match) return <p className="text-gray-500">Match not found.</p>;

  const match = hub.match;
  const role = hub.role;

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/competitions/${match.round?.competition?.id ?? ''}`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          &larr; Back to competition
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {match.homeTeam?.name} vs {match.awayTeam?.name}
        </h1>
        <p className="text-sm text-gray-500">
          {match.round?.name ?? `Round ${match.round?.roundNumber}`}
          {match.round?.competition?.name && ` \u00b7 ${match.round.competition.name}`}
        </p>
      </div>

      {/* Match Status Banner */}
      <MatchStatusBanner hub={hub} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main column: chat + result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Result Section */}
          {match.status === 'COMPLETED' || match.result ? (
            <ResultDisplay hub={hub} userId={user?.id} />
          ) : role !== 'VIEWER' ? (
            <ResultEntry hub={hub} matchId={matchId!} />
          ) : null}

          {/* Game Stats Section */}
          {match.result && role !== 'VIEWER' && (
            <GameStatsSection
              matchId={matchId!}
              hub={hub}
              userId={user?.id}
            />
          )}

          {/* Conversation */}
          {role !== 'VIEWER' ? (
            <ConversationSection
              matchId={matchId!}
              messages={hub.messages ?? []}
              userId={user?.id}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-sm text-gray-400">
                Conversation is only visible to involved team owners and admins.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: scheduling */}
        <div className="space-y-6">
          <ScheduleInfo hub={hub} />

          {role !== 'VIEWER' && (
            <TimeProposalSection
              matchId={matchId!}
              hub={hub}
              userId={user?.id}
            />
          )}

          {/* Quick links */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2">
              <Link
                to={`/matches/${matchId}/stats`}
                className="block text-sm text-indigo-600 hover:text-indigo-800"
              >
                View/Edit Match Stats &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchStatusBanner({ hub }: { hub: MatchHub }) {
  const match = hub.match;
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-800', label: 'Scheduled' },
    IN_PROGRESS: { bg: 'bg-yellow-50', text: 'text-yellow-800', label: 'In Progress' },
    COMPLETED: { bg: 'bg-green-50', text: 'text-green-800', label: 'Completed' },
    CANCELLED: { bg: 'bg-gray-50', text: 'text-gray-800', label: 'Cancelled' },
  };

  const status = statusConfig[match.status] ?? statusConfig.SCHEDULED;

  return (
    <div className={`${status.bg} rounded-lg p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${status.text} ${status.bg}`}>
          {status.label}
        </span>
        {match.scheduledAt && (
          <span className="text-sm text-gray-700">
            {new Date(match.scheduledAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {!match.scheduledAt && match.status === 'SCHEDULED' && (
          <span className="text-sm text-gray-500 italic">No time set yet</span>
        )}
      </div>
      {match.result && (
        <div className="text-lg font-bold text-gray-900">
          {match.result.homeScore} - {match.result.awayScore}
        </div>
      )}
    </div>
  );
}

function ScheduleInfo({ hub }: { hub: MatchHub }) {
  const match = hub.match;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Match Details</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Home</span>
          <span className="font-medium text-gray-900">{match.homeTeam?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Away</span>
          <span className="font-medium text-gray-900">{match.awayTeam?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Home Owner</span>
          <span className="text-gray-700">
            {(match.homeTeam as any)?.owner?.discordUsername ?? 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Away Owner</span>
          <span className="text-gray-700">
            {(match.awayTeam as any)?.owner?.discordUsername ?? 'N/A'}
          </span>
        </div>
        {match.scheduledAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">Scheduled</span>
            <span className="text-gray-700">
              {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeProposalSection({
  matchId,
  hub,
  userId,
}: {
  matchId: string;
  hub: MatchHub;
  userId?: string;
}) {
  const match = hub.match;
  const proposals = hub.timeProposals ?? [];
  const isAdmin = hub.role === 'ADMIN';
  const proposeTime = useProposeTime(matchId);
  const respondToProposal = useRespondToProposal(matchId);
  const adminSetTime = useAdminSetTime(matchId);

  const [proposing, setProposing] = useState(false);
  const [proposedTime, setProposedTime] = useState('');
  const [adminSettingTime, setAdminSettingTime] = useState(false);
  const [adminTime, setAdminTime] = useState('');

  const matchCompleted = match.status === 'COMPLETED' || match.status === 'CANCELLED';
  const pendingProposal = proposals.find((p) => p.status === 'PENDING');

  const handlePropose = () => {
    if (!proposedTime) return;
    proposeTime.mutate(
      { proposedTime: new Date(proposedTime).toISOString() },
      {
        onSuccess: () => {
          setProposing(false);
          setProposedTime('');
        },
      },
    );
  };

  const handleAdminSetTime = () => {
    if (!adminTime) return;
    adminSetTime.mutate(
      { proposedTime: new Date(adminTime).toISOString() },
      {
        onSuccess: () => {
          setAdminSettingTime(false);
          setAdminTime('');
        },
      },
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Scheduling</h3>

      {matchCompleted ? (
        <p className="text-sm text-gray-400 italic">Match has concluded.</p>
      ) : (
        <>
          {/* Pending proposal */}
          {pendingProposal && (
            <div className="bg-yellow-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Pending Proposal
              </p>
              <p className="text-sm text-gray-700">
                {pendingProposal.proposedBy?.discordUsername} proposed:
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(pendingProposal.proposedTime).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {pendingProposal.proposedById !== userId && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      respondToProposal.mutate({
                        proposalId: pendingProposal.id,
                        response: 'ACCEPTED',
                      })
                    }
                    disabled={respondToProposal.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      respondToProposal.mutate({
                        proposalId: pendingProposal.id,
                        response: 'DECLINED',
                      })
                    }
                    disabled={respondToProposal.isPending}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm"
                  >
                    Decline
                  </button>
                </div>
              )}
              {pendingProposal.proposedById === userId && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  Waiting for the other owner to respond...
                </p>
              )}
            </div>
          )}

          {/* Propose new time */}
          {proposing ? (
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePropose}
                  disabled={proposeTime.isPending || !proposedTime}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                >
                  {proposeTime.isPending ? 'Proposing...' : 'Propose Time'}
                </button>
                <button
                  onClick={() => {
                    setProposing(false);
                    setProposedTime('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setProposing(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Propose a time
            </button>
          )}

          {/* Admin: directly set time */}
          {isAdmin && (
            <div className="mt-3 pt-3 border-t">
              {adminSettingTime ? (
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Admin: Set time directly</label>
                  <input
                    type="datetime-local"
                    value={adminTime}
                    onChange={(e) => setAdminTime(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdminSetTime}
                      disabled={adminSetTime.isPending || !adminTime}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                    >
                      {adminSetTime.isPending ? 'Setting...' : 'Set Time'}
                    </button>
                    <button
                      onClick={() => {
                        setAdminSettingTime(false);
                        setAdminTime('');
                      }}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdminSettingTime(true)}
                  className="text-sm text-orange-600 hover:text-orange-800"
                >
                  Admin: Set time directly
                </button>
              )}
            </div>
          )}

          {/* Proposal history */}
          {proposals.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">History</p>
              <div className="space-y-2">
                {proposals
                  .filter((p) => p.status !== 'PENDING')
                  .map((p) => (
                    <div key={p.id} className="text-xs text-gray-600">
                      <span className="font-medium">
                        {p.proposedBy?.discordUsername}
                      </span>{' '}
                      proposed{' '}
                      {new Date(p.proposedTime).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      &mdash;{' '}
                      <span
                        className={
                          p.status === 'ACCEPTED'
                            ? 'text-green-600'
                            : 'text-red-500'
                        }
                      >
                        {p.status.toLowerCase()}
                      </span>
                      {p.respondedBy && (
                        <span> by {p.respondedBy.discordUsername}</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConversationSection({
  matchId,
  messages,
  userId,
}: {
  matchId: string;
  messages: MatchMessage[];
  userId?: string;
}) {
  const [messageText, setMessageText] = useState('');
  const sendMessage = useSendMessage(matchId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;
    sendMessage.mutate(
      { content: text },
      { onSuccess: () => setMessageText('') },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900">Conversation</h3>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center mt-8">
            No messages yet. Start the conversation to coordinate your match.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.authorId === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  isOwn
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!isOwn && (
                  <p
                    className={`text-xs font-medium mb-1 ${
                      isOwn ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {msg.author?.discordUsername}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-indigo-300' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleSend}
          disabled={sendMessage.isPending || !messageText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ResultDisplay({ hub, userId }: { hub: MatchHub; userId?: string }) {
  const result = hub.match.result;
  if (!result) return null;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    DISPUTED: 'bg-red-100 text-red-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
  };

  const isInvolved = hub.role === 'ADMIN' || hub.role === 'INVOLVED';
  const canDispute =
    hub.role === 'INVOLVED' &&
    result.status === 'PENDING' &&
    result.submittedById !== userId;
  const canConfirm = hub.role === 'ADMIN' && result.status === 'PENDING';

  const disputeResult = useDisputeResult();
  const confirmResult = useConfirmResult();
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Result</h3>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[result.status]}`}>
          {result.status}
        </span>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">{hub.match.homeTeam?.name}</p>
            <p className="text-3xl font-bold text-gray-900">{result.homeScore}</p>
          </div>
          <span className="text-gray-400 text-lg">-</span>
          <div className="text-left">
            <p className="text-sm text-gray-500">{hub.match.awayTeam?.name}</p>
            <p className="text-3xl font-bold text-gray-900">{result.awayScore}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Submitted by {result.submittedBy?.discordUsername}
        </p>
        {result.disputeReason && (
          <p className="text-xs text-red-600 mt-1">
            Disputed: {result.disputeReason}
          </p>
        )}
        {result.resolutionNote && (
          <p className="text-xs text-blue-600 mt-1">
            Resolution: {result.resolutionNote}
          </p>
        )}
      </div>

      {isInvolved && (
        <div className="flex justify-center gap-2 mt-4">
          {canDispute && !disputing && (
            <button
              onClick={() => setDisputing(true)}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm"
            >
              Report Incorrect
            </button>
          )}
          {canConfirm && (
            <button
              onClick={() => confirmResult.mutate(result.id)}
              disabled={confirmResult.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
            >
              {confirmResult.isPending ? 'Confirming...' : 'Confirm Result'}
            </button>
          )}
        </div>
      )}

      {disputing && (
        <div className="mt-3 space-y-2">
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Reason for dispute (optional)"
            rows={2}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                disputeResult.mutate(
                  { id: result.id, reason: disputeReason || undefined },
                  { onSuccess: () => setDisputing(false) },
                );
              }}
              disabled={disputeResult.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
            >
              Submit Dispute
            </button>
            <button
              onClick={() => {
                setDisputing(false);
                setDisputeReason('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultEntry({ hub, matchId }: { hub: MatchHub; matchId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const submitResult = useSubmitResult(matchId);

  if (hub.role === 'VIEWER') return null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Submit Result</h3>
      {submitting ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 items-center">
            <div className="text-right">
              <label className="text-sm text-gray-600">{hub.match.homeTeam?.name}</label>
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-center text-lg font-bold mt-1"
                placeholder="0"
              />
            </div>
            <div className="text-center text-gray-400 text-lg pt-6">-</div>
            <div>
              <label className="text-sm text-gray-600">{hub.match.awayTeam?.name}</label>
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-center text-lg font-bold mt-1"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                const hs = parseInt(homeScore);
                const as_ = parseInt(awayScore);
                if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return;
                submitResult.mutate(
                  { homeScore: hs, awayScore: as_ },
                  { onSuccess: () => setSubmitting(false) },
                );
              }}
              disabled={submitResult.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
            >
              {submitResult.isPending ? 'Submitting...' : 'Submit Score'}
            </button>
            <button
              onClick={() => {
                setSubmitting(false);
                setHomeScore('');
                setAwayScore('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setSubmitting(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Enter match result
        </button>
      )}
    </div>
  );
}

function GameStatsSection({
  matchId,
  hub,
  userId,
}: {
  matchId: string;
  hub: MatchHub;
  userId?: string;
}) {
  const match = hub.match;
  const { data: gameStats, isLoading: gameStatsLoading } = useMatchGameStats(matchId);
  const { data: matchStatsData, isLoading: matchStatsLoading } = useMatchStats(matchId);

  if (gameStatsLoading || matchStatsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-400">Loading game stats...</p>
      </div>
    );
  }

  // Determine which team the current user owns
  const userTeamId =
    (match.homeTeam?.owner as any)?.id === userId
      ? match.homeTeamId
      : (match.awayTeam?.owner as any)?.id === userId
        ? match.awayTeamId
        : null;

  const isAdmin = hub.role === 'ADMIN';

  // Split game stats by team
  const homeStats = gameStats?.filter((s) => s.teamId === match.homeTeamId) ?? [];
  const awayStats = gameStats?.filter((s) => s.teamId === match.awayTeamId) ?? [];

  // Get lineup data from matchStats
  const homeLineup = matchStatsData?.homeLineup ?? [];
  const awayLineup = matchStatsData?.awayLineup ?? [];

  // Determine what to render for each team
  const renderTeamStats = (
    teamId: string,
    teamName: string | undefined,
    teamStats: typeof homeStats,
    lineup: typeof homeLineup,
    isUserTeam: boolean,
  ) => {
    const hasStats = teamStats.length > 0;
    const opposingTeam = !isUserTeam && !isAdmin;
    const isOpposingOwner =
      hub.role === 'INVOLVED' &&
      userTeamId !== null &&
      userTeamId !== teamId;

    if (hasStats) {
      // Show review component
      const canConfirm =
        isOpposingOwner &&
        teamStats.some((s) => s.status === 'PENDING');
      const canDispute =
        isOpposingOwner &&
        teamStats.some(
          (s) => s.status === 'PENDING' || s.status === 'CONFIRMED',
        );

      return (
        <div key={teamId}>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            {teamName} Stats
          </p>
          <GameStatsReview
            matchId={matchId}
            stats={teamStats}
            canConfirm={canConfirm}
            canDispute={canDispute}
          />
        </div>
      );
    }

    // No stats yet — show entry form if this is the user's team or user is admin
    if (isUserTeam || isAdmin) {
      const players = lineup.map((entry) => ({
        playerId: entry.playerId,
        position: entry.position,
        isStarter: entry.isStarter,
        player: entry.player
          ? { firstName: entry.player.firstName, lastName: entry.player.lastName }
          : undefined,
      }));

      if (players.length === 0) {
        return (
          <div key={teamId} className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              {teamName} Stats
            </p>
            <p className="text-sm text-gray-400 italic">
              No lineup set for {teamName}. Please{' '}
              <Link
                to={`/matches/${matchId}/stats`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                set up the lineup
              </Link>{' '}
              first before entering game stats.
            </p>
          </div>
        );
      }

      return (
        <div key={teamId}>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            {teamName} Stats
          </p>
          <GameStatsEntryForm
            matchId={matchId}
            teamId={teamId}
            players={players}
          />
        </div>
      );
    }

    // Not the user's team and no stats — show a placeholder
    return (
      <div key={teamId} className="bg-white rounded-lg shadow p-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">
          {teamName} Stats
        </p>
        <p className="text-sm text-gray-400 italic">
          Waiting for {teamName} to submit their game stats.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Game Stats</h3>
      {renderTeamStats(
        match.homeTeamId,
        match.homeTeam?.name,
        homeStats,
        homeLineup,
        userTeamId === match.homeTeamId,
      )}
      {renderTeamStats(
        match.awayTeamId,
        match.awayTeam?.name,
        awayStats,
        awayLineup,
        userTeamId === match.awayTeamId,
      )}
    </div>
  );
}
