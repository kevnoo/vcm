import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { WaiverWire } from '@vcm/shared';

export function useWaivers() {
  return useQuery<WaiverWire[]>({
    queryKey: ['waivers'],
    queryFn: () => api.get('/waivers').then((r) => r.data),
  });
}

export function useWaiver(id: string) {
  return useQuery<WaiverWire>({
    queryKey: ['waivers', id],
    queryFn: () => api.get(`/waivers/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useReleasePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) =>
      api.post('/waivers', { playerId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waivers'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function usePlaceWaiverBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ waiverWireId, amount }: { waiverWireId: string; amount: number }) =>
      api.post(`/waivers/${waiverWireId}/bid`, { amount }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waivers'] }),
  });
}

export function useWithdrawBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (waiverWireId: string) =>
      api.delete(`/waivers/${waiverWireId}/bid`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waivers'] }),
  });
}

export function useResolveWaiver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/waivers/${id}/resolve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waivers'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCancelWaiver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/waivers/${id}/cancel`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waivers'] }),
  });
}
