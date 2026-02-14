import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateCompetition } from '../../hooks/useCompetitions';

const competitionTypes = [
  { value: 'DOUBLE_ROUND_ROBIN', label: 'Double Round Robin' },
  { value: 'SINGLE_ROUND_ROBIN', label: 'Single Round Robin' },
  { value: 'KNOCKOUT_CUP', label: 'Knockout Cup' },
  { value: 'PLAYOFF', label: 'Playoff' },
];

export function CreateCompetitionPage() {
  const navigate = useNavigate();
  const createCompetition = useCreateCompetition();

  const [name, setName] = useState('');
  const [type, setType] = useState('DOUBLE_ROUND_ROBIN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompetition.mutate(
      { name, type: type as any },
      { onSuccess: (data) => navigate(`/competitions/${data.id}`) },
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Create Competition
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Competition Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Season 1 League"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {competitionTypes.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createCompetition.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {createCompetition.isPending ? 'Creating...' : 'Create Competition'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/competitions')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
