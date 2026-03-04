import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
      toast.success('Result submitted');
    },
    onError: () => {
      toast.error('Something went wrong');
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
      toast.success('Result disputed');
    },
    onError: () => {
      toast.error('Something went wrong');
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
      toast.success('Dispute resolved');
    },
    onError: () => {
      toast.error('Something went wrong');
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
      toast.success('Result confirmed');
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });
}

export function useDisputes() {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: () => api.get('/admin/disputes').then((r) => r.data),
  });
}
