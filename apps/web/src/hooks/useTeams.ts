import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Team, CreateTeamDto, UpdateTeamDto, SetBudgetDto } from '@vcm/shared';

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((r) => r.data),
  });
}

export function useTeam(id: string) {
  return useQuery<Team>({
    queryKey: ['teams', id],
    queryFn: () => api.get(`/teams/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeamDto) => api.post('/teams', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTeamDto & { id: string }) =>
      api.patch(`/teams/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/teams/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useSetTeamBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, budget }: { id: string; budget: number }) =>
      api.patch(`/teams/${id}/budget`, { budget }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}
