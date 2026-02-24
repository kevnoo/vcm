import { create } from 'zustand';
import type { User } from '@vcm/shared';

interface AuthState {
  token: string | null;
  user: User | null;
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
  activeView: (localStorage.getItem('vcm_active_view') as 'admin' | 'owner') ?? 'owner',
  setAuth: (token, user) => {
    localStorage.setItem('vcm_token', token);
    const defaultView = user.role === 'ADMIN' ? 'admin' : 'owner';
    const storedView = localStorage.getItem('vcm_active_view') as 'admin' | 'owner' | null;
    // Respect stored preference if user is admin, otherwise force 'owner'
    const activeView = user.role === 'ADMIN' && storedView ? storedView : defaultView;
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
