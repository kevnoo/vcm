import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Transaction } from '@vcm/shared';

export function useTransactions(filters?: {
  type?: string;
  teamId?: string;
  playerId?: string;
}) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', filters],
    queryFn: () =>
      api
        .get('/transactions', {
          params: {
            ...(filters?.type && { type: filters.type }),
            ...(filters?.teamId && { teamId: filters.teamId }),
            ...(filters?.playerId && { playerId: filters.playerId }),
          },
        })
        .then((r) => r.data),
  });
}

export function useTransaction(id: string) {
  return useQuery<Transaction>({
    queryKey: ['transactions', id],
    queryFn: () => api.get(`/transactions/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
