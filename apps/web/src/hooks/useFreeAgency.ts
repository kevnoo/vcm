import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Player } from '@vcm/shared';

export function useFreeAgents() {
  return useQuery<Player[]>({
    queryKey: ['free-agency'],
    queryFn: () => api.get('/free-agency').then((r) => r.data),
  });
}

export function useClaimFreeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, teamId }: { playerId: string; teamId: string }) =>
      api.post(`/free-agency/${playerId}/claim`, { teamId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-agency'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useAdminAddFreeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) =>
      api.post(`/free-agency/${playerId}/add`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-agency'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useAdminRemoveFreeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, teamId }: { playerId: string; teamId: string }) =>
      api.delete(`/free-agency/${playerId}/remove`, { params: { teamId } }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-agency'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
