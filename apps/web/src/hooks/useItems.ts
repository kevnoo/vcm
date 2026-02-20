import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  ItemDefinition,
  TeamItem,
  ItemUsageLog,
  CreateItemDefinitionDto,
  UpdateItemDefinitionDto,
  BuyItemDto,
  UseItemDto,
} from '@vcm/shared';

// ─── Admin: Item Definitions ────────────────────────────

export function useAdminItems() {
  return useQuery<ItemDefinition[]>({
    queryKey: ['admin', 'items'],
    queryFn: () => api.get('/admin/items').then((r) => r.data),
  });
}

export function useCreateItemDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemDefinitionDto) =>
      api.post('/admin/items', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

export function useUpdateItemDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateItemDefinitionDto & { id: string }) =>
      api.patch(`/admin/items/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

export function useDeleteItemDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

// ─── Shop ───────────────────────────────────────────────

export function useShopItems() {
  return useQuery<ItemDefinition[]>({
    queryKey: ['shop', 'items'],
    queryFn: () => api.get('/shop/items').then((r) => r.data),
  });
}

// ─── Team Inventory ─────────────────────────────────────

export function useTeamItems(teamId: string) {
  return useQuery<TeamItem[]>({
    queryKey: ['teams', teamId, 'items'],
    queryFn: () => api.get(`/teams/${teamId}/items`).then((r) => r.data),
    enabled: !!teamId,
  });
}

export function useBuyItem(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BuyItemDto) =>
      api.post(`/teams/${teamId}/items/buy`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUseItem(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UseItemDto) =>
      api.post('/items/use', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'items', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useTeamItemHistory(teamId: string) {
  return useQuery<ItemUsageLog[]>({
    queryKey: ['teams', teamId, 'items', 'history'],
    queryFn: () => api.get(`/teams/${teamId}/items/history`).then((r) => r.data),
    enabled: !!teamId,
  });
}
