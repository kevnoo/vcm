import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TradeOffer, CreateTradeOfferDto, CounterTradeOfferDto } from '@vcm/shared';

export function useTrades(filters?: { status?: string; teamId?: string }) {
  return useQuery<TradeOffer[]>({
    queryKey: ['trades', filters],
    queryFn: () =>
      api
        .get('/trades', {
          params: {
            ...(filters?.status && { status: filters.status }),
            ...(filters?.teamId && { teamId: filters.teamId }),
          },
        })
        .then((r) => r.data),
  });
}

export function useTradeOffer(id: string) {
  return useQuery<TradeOffer>({
    queryKey: ['trades', id],
    queryFn: () => api.get(`/trades/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePendingTrades() {
  return useQuery<TradeOffer[]>({
    queryKey: ['trades', 'pending-approval'],
    queryFn: () => api.get('/admin/pending-trades').then((r) => r.data),
  });
}

export function useCreateTradeOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTradeOfferDto) => api.post('/trades', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] }),
  });
}

export function useAcceptTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, responseNote }: { id: string; responseNote?: string }) =>
      api.patch(`/trades/${id}/accept`, { responseNote }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] }),
  });
}

export function useRejectTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, responseNote }: { id: string; responseNote?: string }) =>
      api.patch(`/trades/${id}/reject`, { responseNote }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] }),
  });
}

export function useCounterTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: CounterTradeOfferDto & { id: string }) =>
      api.post(`/trades/${id}/counter`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] }),
  });
}

export function useCancelTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/trades/${id}/cancel`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] }),
  });
}

export function useApproveTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      api.patch(`/trades/${id}/approve`, { adminNote }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useDenyTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      api.patch(`/trades/${id}/deny`, { adminNote }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] }),
  });
}
