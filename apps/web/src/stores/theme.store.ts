import { create } from 'zustand';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const STORAGE_KEY = 'vcm_theme';

function getStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: getStoredPreference(),
  setPreference: (preference) => {
    localStorage.setItem(STORAGE_KEY, preference);
    set({ preference });
  },
}));

/** Resolves the current preference to an actual 'light' | 'dark' value. */
export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return preference;
}

/** Applies the resolved theme to the document root. */
export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}
