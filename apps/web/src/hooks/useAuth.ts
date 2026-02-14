import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import type { User } from '@vcm/shared';

export function useCurrentUser() {
  const { token, setAuth } = useAuthStore();

  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      setAuth(token!, data);
      return data;
    },
    enabled: !!token,
    retry: false,
  });
}
