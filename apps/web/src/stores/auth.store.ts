import { create } from 'zustand';
import type { User } from '@vcm/shared';

function parseActiveView(value: string | null): 'admin' | 'owner' {
  return value === 'admin' ? 'admin' : 'owner';
}

interface AuthState {
  token: string | null;
  user: User | null;
  /** Use isInAdminView() for rendering decisions. Raw activeView may be stale before auth resolves. */
  activeView: 'admin' | 'owner';
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  switchView: (view: 'admin' | 'owner') => void;
  isAdmin: () => boolean;
  isInAdminView: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('vcm_token'),
  user: null,
  activeView: parseActiveView(localStorage.getItem('vcm_active_view')),
  setAuth: (token, user) => {
    localStorage.setItem('vcm_token', token);
    const storedView = localStorage.getItem('vcm_active_view');
    const activeView = user.role === 'ADMIN'
      ? (storedView ? parseActiveView(storedView) : 'admin')
      : 'owner';
    localStorage.setItem('vcm_active_view', activeView);
    set({ token, user, activeView });
  },
  clearAuth: () => {
    localStorage.removeItem('vcm_token');
    localStorage.removeItem('vcm_active_view');
    set({ token: null, user: null, activeView: 'owner' });
  },
  switchView: (view) => {
    const { user } = get();
    if (user?.role !== 'ADMIN') return;
    localStorage.setItem('vcm_active_view', view);
    set({ activeView: view });
  },
  isAdmin: () => get().user?.role === 'ADMIN',
  isInAdminView: () => get().activeView === 'admin' && get().user?.role === 'ADMIN',
}));
