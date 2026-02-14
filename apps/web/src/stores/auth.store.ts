import { create } from 'zustand';
import type { User } from '@vcm/shared';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('vcm_token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('vcm_token', token);
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem('vcm_token');
    set({ token: null, user: null });
  },
  isAdmin: () => get().user?.role === 'ADMIN',
}));
