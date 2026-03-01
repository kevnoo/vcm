import { Link } from 'react-router';
import { useTeams } from '../../hooks/useTeams';
import { useCompetitions } from '../../hooks/useCompetitions';
import { usePlayers } from '../../hooks/usePlayers';
import { useLeagueSettings } from '../../hooks/useLeagueSettings';
import { useSkillGroups, usePlayerRoleDefinitions, usePlayStyleDefinitions } from '../../hooks/useReferenceData';
import { useUsers } from '../../hooks/useUsers';

// ─── Types ───────────────────────────────────────────────

interface SetupStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  loading: boolean;
  linkTo: string;
  linkLabel: string;
  detail?: string;
}

interface SetupPhase {
  id: string;
  number: number;
  title: string;
  description: string;
  steps: SetupStep[];
  optional?: boolean;
}

// ─── Hook: Setup Status ──────────────────────────────────

function useSetupStatus(): { phases: SetupPhase[]; isLoading: boolean } {
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: competitions, isLoading: compsLoading } = useCompetitions();
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: settings, isLoading: settingsLoading } = useLeagueSettings();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: skillGroups, isLoading: skillsLoading } = useSkillGroups();
  const { data: playerRoles, isLoading: rolesLoading } = usePlayerRoleDefinitions();
  const { data: playStyles, isLoading: stylesLoading } = usePlayStyleDefinitions();

  const isLoading =
    teamsLoading || compsLoading || playersLoading || settingsLoading ||
    usersLoading || skillsLoading || rolesLoading || stylesLoading;

  // Derive setup state
  const teamCount = teams?.length ?? 0;
  const teamsWithOwners = teams?.filter((t) => t.ownerId).length ?? 0;
  const teamsWithBudgets = teams?.filter((t) => t.budget > 0).length ?? 0;

  const playerCount = players?.length ?? 0;
  const playersOnTeams = players?.filter((p) => p.teamId).length ?? 0;

  const skillGroupCount = skillGroups?.length ?? 0;
  const totalSkills = skillGroups?.reduce((acc, sg) => acc + (sg.skills?.length ?? 0), 0) ?? 0;
  const roleCount = playerRoles?.length ?? 0;
  const styleCount = playStyles?.length ?? 0;
  const hasReferenceData = skillGroupCount > 0 && roleCount > 0 && styleCount > 0;

  const compCount = competitions?.length ?? 0;
  const compsWithTeams = competitions?.filter((c) => (c.teams?.length ?? 0) >= 2).length ?? 0;
  const compsWithSchedule = competitions?.filter(
    (c) => (c.rounds?.length ?? 0) > 0,
  ).length ?? 0;
  const activeComps = competitions?.filter((c) => c.status === 'ACTIVE').length ?? 0;

  const getSetting = (key: string) => settings?.find((s) => s.key === key)?.value;
  const hasWebhookResults = !!getSetting('discord_webhook_results');
  const hasWebhookTransactions = !!getSetting('discord_webhook_transactions');
  const hasWebhookAdmin = !!getSetting('discord_webhook_admin');
  const webhookCount = [hasWebhookResults, hasWebhookTransactions, hasWebhookAdmin].filter(Boolean).length;

  const hasWaiverDays = !!getSetting('waiver_period_days');
  const hasTradeExpiry = !!getSetting('trade_offer_expiry_days');
  const hasFACost = !!getSetting('free_agency_cost_percent');
  const ruleCount = [hasWaiverDays, hasTradeExpiry, hasFACost].filter(Boolean).length;

  const phases: SetupPhase[] = [
    {
      id: 'foundation',
      number: 1,
      title: 'Foundation',
      description: 'Create teams and assign owners to get your league structure in place.',
      steps: [
        {
          id: 'create-teams',
          label: 'Create Teams',
          description: 'Add at least 2 teams to your league.',
          completed: teamCount >= 2,
          loading: teamsLoading,
          linkTo: '/teams/create',
          linkLabel: 'Add Team',
          detail: teamCount > 0 ? `${teamCount} team${teamCount !== 1 ? 's' : ''} created` : undefined,
        },
        {
          id: 'assign-owners',
          label: 'Assign Team Owners',
          description: 'Every team needs an owner to manage it.',
          completed: teamCount >= 2 && teamsWithOwners === teamCount,
          loading: teamsLoading,
          linkTo: '/teams',
          linkLabel: 'Manage Teams',
          detail: teamCount > 0 ? `${teamsWithOwners}/${teamCount} teams have owners` : undefined,
        },
        {
          id: 'set-budgets',
          label: 'Set Team Budgets',
          description: 'Give teams a transfer budget for player transactions.',
          completed: teamCount >= 2 && teamsWithBudgets === teamCount,
          loading: teamsLoading,
          linkTo: '/teams',
          linkLabel: 'Manage Teams',
          detail: teamCount > 0 ? `${teamsWithBudgets}/${teamCount} budgets set` : undefined,
        },
      ],
    },
    {
      id: 'players',
      number: 2,
      title: 'Player Database',
      description: 'Set up skills, roles, and import your player pool.',
      steps: [
        {
          id: 'reference-data',
          label: 'Set Up Reference Data',
          description: 'Define skill groups, player roles, and play styles before importing players.',
          completed: hasReferenceData,
          loading: skillsLoading || rolesLoading || stylesLoading,
          linkTo: '/admin/reference-data',
          linkLabel: 'Reference Data',
          detail: `${skillGroupCount} skill groups, ${roleCount} roles, ${styleCount} play styles`,
        },
        {
          id: 'create-players',
          label: 'Import or Create Players',
          description: 'Add players individually or bulk import via CSV.',
          completed: playerCount >= 10,
          loading: playersLoading,
          linkTo: '/admin/csv-import',
          linkLabel: 'CSV Import',
          detail: playerCount > 0 ? `${playerCount} player${playerCount !== 1 ? 's' : ''} in database` : undefined,
        },
        {
          id: 'assign-players',
          label: 'Assign Players to Teams',
          description: 'Distribute players across your teams\u2019 rosters.',
          completed: playerCount >= 10 && playersOnTeams >= Math.floor(playerCount * 0.5),
          loading: playersLoading,
          linkTo: '/players',
          linkLabel: 'Manage Players',
          detail: playerCount > 0 ? `${playersOnTeams}/${playerCount} assigned to teams` : undefined,
        },
      ],
    },
    {
      id: 'competitions',
      number: 3,
      title: 'Competitions',
      description: 'Create competitions, schedule matches, and go live.',
      steps: [
        {
          id: 'create-competition',
          label: 'Create a Competition',
          description: 'Set up a league, cup, or playoff format.',
          completed: compCount >= 1,
          loading: compsLoading,
          linkTo: '/competitions/create',
          linkLabel: 'Create Competition',
          detail: compCount > 0 ? `${compCount} competition${compCount !== 1 ? 's' : ''} created` : undefined,
        },
        {
          id: 'add-teams-to-comp',
          label: 'Add Teams to Competition',
          description: 'Assign at least 2 teams to each competition.',
          completed: compCount >= 1 && compsWithTeams === compCount,
          loading: compsLoading,
          linkTo: '/competitions',
          linkLabel: 'View Competitions',
          detail: compCount > 0 ? `${compsWithTeams}/${compCount} have teams assigned` : undefined,
        },
        {
          id: 'generate-schedule',
          label: 'Generate Match Schedule',
          description: 'Auto-generate match fixtures for each competition.',
          completed: compCount >= 1 && compsWithSchedule === compCount,
          loading: compsLoading,
          linkTo: '/competitions',
          linkLabel: 'View Competitions',
          detail: compCount > 0 ? `${compsWithSchedule}/${compCount} have schedules` : undefined,
        },
        {
          id: 'activate-competition',
          label: 'Activate a Competition',
          description: 'Move at least one competition from Draft to Active.',
          completed: activeComps >= 1,
          loading: compsLoading,
          linkTo: '/competitions',
          linkLabel: 'View Competitions',
          detail: activeComps > 0 ? `${activeComps} active competition${activeComps !== 1 ? 's' : ''}` : undefined,
        },
      ],
    },
    {
      id: 'discord',
      number: 4,
      title: 'Discord Integration',
      description: 'Connect Discord webhooks for automated notifications.',
      optional: true,
      steps: [
        {
          id: 'webhooks',
          label: 'Configure Discord Webhooks',
          description: 'Set up webhooks for results, transactions, and admin alerts.',
          completed: webhookCount === 3,
          loading: settingsLoading,
          linkTo: '/admin/league-settings',
          linkLabel: 'League Settings',
          detail: `${webhookCount}/3 webhooks configured`,
        },
      ],
    },
    {
      id: 'rules',
      number: 5,
      title: 'League Rules',
      description: 'Fine-tune league rules for trades, waivers, and free agency.',
      optional: true,
      steps: [
        {
          id: 'league-rules',
          label: 'Configure League Rules',
          description: 'Set waiver period, trade offer expiry, and free agency costs.',
          completed: ruleCount === 3,
          loading: settingsLoading,
          linkTo: '/admin/league-settings',
          linkLabel: 'League Settings',
          detail: `${ruleCount}/3 rules configured`,
        },
      ],
    },
  ];

  return { phases, isLoading };
}

// ─── Components ──────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Overall Progress
        </span>
        <span className="text-sm font-bold text-gray-900 tabular-nums">
          {completed}/{total} steps
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background:
              pct === 100
                ? 'linear-gradient(90deg, #059669, #10b981)'
                : 'linear-gradient(90deg, #4f46e5, #818cf8)',
          }}
        />
      </div>
      <div className="mt-1.5 text-right">
        <span
          className={`text-xs font-bold tabular-nums ${
            pct === 100 ? 'text-emerald-600' : 'text-indigo-600'
          }`}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

function PhaseHeader({
  phase,
  completedSteps,
}: {
  phase: SetupPhase;
  completedSteps: number;
}) {
  const allDone = completedSteps === phase.steps.length;

  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black shrink-0 transition-colors ${
          allDone
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-indigo-100 text-indigo-700'
        }`}
      >
        {allDone ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          phase.number
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-gray-900">{phase.title}</h2>
          {phase.optional && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              Optional
            </span>
          )}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-auto tabular-nums ${
              allDone
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {completedSteps}/{phase.steps.length}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{phase.description}</p>
      </div>
    </div>
  );
}

function StepRow({ step, isLast }: { step: SetupStep; isLast: boolean }) {
  return (
    <div className={`relative flex gap-4 ${!isLast ? 'pb-6' : ''}`}>
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-8 bottom-0 w-px bg-gray-200" />
      )}

      {/* Status indicator */}
      <div className="relative z-10 shrink-0 mt-0.5">
        {step.loading ? (
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : step.completed ? (
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`text-sm font-semibold ${
                step.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900'
              }`}
            >
              {step.label}
            </h3>
            <p className={`text-sm mt-0.5 ${step.completed ? 'text-gray-400' : 'text-gray-500'}`}>
              {step.description}
            </p>
            {step.detail && (
              <p className={`text-xs mt-1 font-medium tabular-nums ${
                step.completed ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                {step.detail}
              </p>
            )}
          </div>

          {!step.completed && !step.loading && (
            <Link
              to={step.linkTo}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-lg transition-colors"
            >
              {step.linkLabel}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────

export function SetupGuidePage() {
  const { phases, isLoading } = useSetupStatus();

  const allSteps = phases.flatMap((p) => p.steps);
  const completedCount = allSteps.filter((s) => s.completed).length;
  const totalCount = allSteps.length;
  const allDone = completedCount === totalCount;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">League Setup Guide</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete these steps to get your league up and running. Progress is tracked automatically.
        </p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        {isLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            Checking setup status...
          </div>
        ) : allDone ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">League Setup Complete</h2>
            <p className="text-sm text-gray-500 mt-1">
              All steps are done. Your league is ready to go.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Go to Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        ) : (
          <ProgressBar completed={completedCount} total={totalCount} />
        )}
      </div>

      {/* Phases */}
      <div className="space-y-8">
        {phases.map((phase) => {
          const phaseCompleted = phase.steps.filter((s) => s.completed).length;

          return (
            <div key={phase.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <PhaseHeader phase={phase} completedSteps={phaseCompleted} />
              </div>
              <div className="p-5 pl-5">
                {phase.steps.map((step, i) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    isLast={i === phase.steps.length - 1}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacer */}
      <div className="h-12" />
    </div>
  );
}
