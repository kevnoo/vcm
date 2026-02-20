import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  Bundle,
  CreateBundleDto,
  UpdateBundleDto,
  BuyBundleDto,
} from '@vcm/shared';

// ─── Admin: Bundle CRUD ────────────────────────────────

export function useAdminBundles() {
  return useQuery<Bundle[]>({
    queryKey: ['admin', 'bundles'],
    queryFn: () => api.get('/admin/bundles').then((r) => r.data),
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBundleDto) =>
      api.post('/admin/bundles', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

export function useUpdateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBundleDto & { id: string }) =>
      api.patch(`/admin/bundles/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

export function useDeleteBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/bundles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

// ─── Shop ───────────────────────────────────────────────

export function useShopBundles() {
  return useQuery<Bundle[]>({
    queryKey: ['shop', 'bundles'],
    queryFn: () => api.get('/shop/bundles').then((r) => r.data),
  });
}

// ─── Buy Bundle ─────────────────────────────────────────

export function useBuyBundle(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BuyBundleDto) =>
      api.post(`/teams/${teamId}/bundles/buy`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
