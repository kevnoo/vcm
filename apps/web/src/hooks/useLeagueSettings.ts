import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LeagueSetting } from '@vcm/shared';

export function useLeagueSettings() {
  return useQuery<LeagueSetting[]>({
    queryKey: ['league-settings'],
    queryFn: () => api.get('/league-settings').then((r) => r.data),
  });
}

export function useLeagueSetting(key: string) {
  return useQuery<LeagueSetting>({
    queryKey: ['league-settings', key],
    queryFn: () => api.get(`/league-settings/${key}`).then((r) => r.data),
    enabled: !!key,
  });
}

export function useUpsertLeagueSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/league-settings/${key}`, { value }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['league-settings'] }),
  });
}

export function useDeleteLeagueSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => api.delete(`/league-settings/${key}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['league-settings'] }),
  });
}
