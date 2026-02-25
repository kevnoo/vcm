import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StatDelegate, AddStatDelegateDto } from '@vcm/shared';

export function useStatDelegates(teamId: string) {
  return useQuery<StatDelegate[]>({
    queryKey: ['stat-delegates', teamId],
    queryFn: () =>
      api.get(`/teams/${teamId}/delegates`).then((r) => r.data),
    enabled: !!teamId,
  });
}

export function useAddStatDelegate(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddStatDelegateDto) =>
      api.post(`/teams/${teamId}/delegates`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-delegates', teamId] });
    },
  });
}

export function useRemoveStatDelegate(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/teams/${teamId}/delegates/${userId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-delegates', teamId] });
    },
  });
}
