import { useThemeStore, resolveTheme } from '../../stores/theme.store';

const options = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
];

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore();
  const resolved = resolveTheme(preference);

  return (
    <div className="flex items-center gap-2">
      {/* Sun / Moon icon */}
      <span className="text-gray-400">
        {resolved === 'dark' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
      </span>
      <select
        value={preference}
        onChange={(e) => setPreference(e.target.value as 'system' | 'light' | 'dark')}
        className="bg-transparent text-xs text-gray-400 hover:text-white border-0 focus:outline-none focus:ring-0 cursor-pointer p-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900 text-gray-300">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
