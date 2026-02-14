import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { SubmitResultDto, DisputeResultDto, ResolveResultDto } from '@vcm/shared';

export function useSubmitResult(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitResultDto) =>
      api.post(`/matches/${matchId}/result`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useDisputeResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: DisputeResultDto & { id: string }) =>
      api.patch(`/results/${id}/dispute`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useResolveResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ResolveResultDto & { id: string }) =>
      api.patch(`/results/${id}/resolve`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useConfirmResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/results/${id}/confirm`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useDisputes() {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: () => api.get('/admin/disputes').then((r) => r.data),
  });
}
