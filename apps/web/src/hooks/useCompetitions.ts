import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Competition, CreateCompetitionDto, AddTeamsDto } from '@vcm/shared';

export function useCompetitions() {
  return useQuery<Competition[]>({
    queryKey: ['competitions'],
    queryFn: () => api.get('/competitions').then((r) => r.data),
  });
}

export function useCompetition(id: string) {
  return useQuery<Competition>({
    queryKey: ['competitions', id],
    queryFn: () => api.get(`/competitions/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompetitionDto) =>
      api.post('/competitions', data).then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['competitions'] }),
  });
}

export function useAddTeams(competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddTeamsDto) =>
      api.post(`/competitions/${competitionId}/teams`, data).then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['competitions', competitionId] }),
  });
}

export function useGenerateSchedule(competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/competitions/${competitionId}/generate-schedule`).then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['competitions', competitionId] }),
  });
}

export function useActivateCompetition(competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/competitions/${competitionId}/activate`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitions', competitionId] });
    },
  });
}
