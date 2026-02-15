import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  Player,
  CreatePlayerDto,
  UpdatePlayerDto,
  SetPlayerSkillsDto,
  AssignPlayerRolesDto,
  AssignPlayerPlayStylesDto,
} from '@vcm/shared';
import type { Position } from '@vcm/shared';

export function usePlayers(filters?: {
  teamId?: string;
  position?: Position;
  freeAgents?: boolean;
}) {
  return useQuery<Player[]>({
    queryKey: ['players', filters],
    queryFn: () =>
      api
        .get('/players', {
          params: {
            ...(filters?.teamId && { teamId: filters.teamId }),
            ...(filters?.position && { position: filters.position }),
            ...(filters?.freeAgents && { freeAgents: 'true' }),
          },
        })
        .then((r) => r.data),
  });
}

export function usePlayer(id: string) {
  return useQuery<Player>({
    queryKey: ['players', id],
    queryFn: () => api.get(`/players/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlayerDto) => api.post('/players', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePlayerDto & { id: string }) =>
      api.patch(`/players/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/players/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useSetPlayerSkills(playerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetPlayerSkillsDto) =>
      api.put(`/players/${playerId}/skills`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players', playerId] }),
  });
}

export function useAssignPlayerRoles(playerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPlayerRolesDto) =>
      api.put(`/players/${playerId}/roles`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players', playerId] }),
  });
}

export function useAssignPlayerPlayStyles(playerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPlayerPlayStylesDto) =>
      api.put(`/players/${playerId}/play-styles`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players', playerId] }),
  });
}
