import { useState } from 'react';
import {
  generateRoundRobin,
  generateKnockout,
  type GeneratedRound,
} from '../../lib/schedule';
import { downloadCSV } from '../../lib/export-csv';

const competitionTypes = [
  { value: 'DOUBLE_ROUND_ROBIN', label: 'Double Round Robin' },
  { value: 'SINGLE_ROUND_ROBIN', label: 'Single Round Robin' },
  { value: 'KNOCKOUT_CUP', label: 'Knockout Cup' },
  { value: 'PLAYOFF', label: 'Playoff' },
] as const;

const PRESET_TEAMS = [
  'Arsenal',
  'Chelsea',
  'Liverpool',
  'Man City',
  'Man United',
  'Tottenham',
  'Newcastle',
  'Aston Villa',
];

export function ScheduleGeneratorPage() {
  const [type, setType] = useState<string>('DOUBLE_ROUND_ROBIN');
  const [teamInput, setTeamInput] = useState('');
  const [teams, setTeams] = useState<string[]>([]);
  const [rounds, setRounds] = useState<GeneratedRound[] | null>(null);

  const addTeam = () => {
    const name = teamInput.trim();
    if (name && !teams.includes(name)) {
      setTeams([...teams, name]);
      setTeamInput('');
    }
  };

  const removeTeam = (name: string) => {
    setTeams(teams.filter((t) => t !== name));
    setRounds(null);
  };

  const loadPreset = () => {
    setTeams(PRESET_TEAMS);
    setRounds(null);
  };

  const generate = () => {
    if (teams.length < 2) return;

    switch (type) {
      case 'DOUBLE_ROUND_ROBIN':
        setRounds(generateRoundRobin(teams, 2));
        break;
      case 'SINGLE_ROUND_ROBIN':
        setRounds(generateRoundRobin(teams, 1));
        break;
      case 'KNOCKOUT_CUP':
      case 'PLAYOFF':
        setRounds(generateKnockout(teams));
        break;
    }
  };

  const totalMatches =
    rounds?.reduce((sum, r) => sum + r.matches.length, 0) ?? 0;

  const exportCSV = () => {
    if (!rounds) return;
    const rows: string[][] = [['Round', 'Match #', 'Home', 'Away']];
    let matchNum = 1;
    for (const round of rounds) {
      for (const match of round.matches) {
        rows.push([round.name, String(matchNum++), match.home, match.away]);
      }
    }
    downloadCSV('schedule.csv', rows);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              &larr; Home
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Schedule Generator
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate match schedules for your league or tournament. This is a
            free tool — no account required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Competition type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Competition Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setRounds(null);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {competitionTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Add teams */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teams ({teams.length})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTeam();
                    }
                  }}
                  placeholder="Team name"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addTeam}
                  disabled={!teamInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Add
                </button>
              </div>
              <button
                onClick={loadPreset}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
              >
                Load sample teams
              </button>
            </div>

            {/* Team list */}
            {teams.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {teams.map((team, i) => (
                  <span
                    key={team}
                    className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-sm"
                  >
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{i + 1}.</span>{' '}
                    {team}
                    <button
                      onClick={() => removeTeam(team)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={teams.length < 2}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              Generate Schedule
            </button>
          </div>

          {/* Right panel: results */}
          <div className="lg:col-span-2">
            {!rounds && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-8 text-center text-gray-400 dark:text-gray-500">
                <p className="text-lg">Add at least 2 teams and click Generate</p>
                <p className="text-sm mt-1">
                  The schedule will appear here
                </p>
              </div>
            )}

            {rounds && (
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Generated Schedule
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {rounds.length} rounds &middot; {totalMatches} matches
                    </p>
                    <button
                      onClick={exportCSV}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Export to CSV
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {rounds.map((round) => (
                    <div
                      key={round.roundNumber}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30"
                    >
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-700 rounded-t-lg">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {round.name}
                        </h3>
                      </div>
                      <div className="divide-y dark:divide-gray-700">
                        {round.matches.map((match, i) => (
                          <div
                            key={i}
                            className="px-4 py-2.5 flex items-center"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-2/5 text-right pr-3">
                              {match.home}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 w-1/5 text-center">
                              vs
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-2/5 pl-3">
                              {match.away}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
