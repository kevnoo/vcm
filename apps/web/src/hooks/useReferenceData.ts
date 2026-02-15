import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  SkillGroup,
  PlayerRoleDefinition,
  PlayStyleDefinition,
  CreateSkillGroupDto,
  UpdateSkillGroupDto,
  CreateSkillDefinitionDto,
  UpdateSkillDefinitionDto,
  CreatePlayerRoleDefinitionDto,
  UpdatePlayerRoleDefinitionDto,
  CreatePlayStyleDefinitionDto,
  UpdatePlayStyleDefinitionDto,
} from '@vcm/shared';
import type { Position } from '@vcm/shared';

// ─── Skill Groups ──────────────────────────────────────
export function useSkillGroups() {
  return useQuery<SkillGroup[]>({
    queryKey: ['skill-groups'],
    queryFn: () => api.get('/reference-data/skill-groups').then((r) => r.data),
  });
}

export function useCreateSkillGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillGroupDto) =>
      api.post('/reference-data/skill-groups', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-groups'] }),
  });
}

export function useUpdateSkillGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSkillGroupDto & { id: string }) =>
      api.patch(`/reference-data/skill-groups/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-groups'] }),
  });
}

export function useDeleteSkillGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reference-data/skill-groups/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-groups'] }),
  });
}

// ─── Skill Definitions ────────────────────────────────
export function useCreateSkillDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillDefinitionDto) =>
      api.post('/reference-data/skills', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-groups'] }),
  });
}

export function useUpdateSkillDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSkillDefinitionDto & { id: string }) =>
      api.patch(`/reference-data/skills/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-groups'] }),
  });
}

export function useDeleteSkillDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reference-data/skills/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill-groups'] }),
  });
}

// ─── Player Role Definitions ──────────────────────────
export function usePlayerRoleDefinitions(position?: Position) {
  return useQuery<PlayerRoleDefinition[]>({
    queryKey: ['player-roles', position],
    queryFn: () =>
      api
        .get('/reference-data/player-roles', { params: position ? { position } : undefined })
        .then((r) => r.data),
  });
}

export function useCreatePlayerRoleDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlayerRoleDefinitionDto) =>
      api.post('/reference-data/player-roles', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-roles'] }),
  });
}

export function useUpdatePlayerRoleDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePlayerRoleDefinitionDto & { id: string }) =>
      api.patch(`/reference-data/player-roles/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-roles'] }),
  });
}

export function useDeletePlayerRoleDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reference-data/player-roles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-roles'] }),
  });
}

// ─── Play Style Definitions ───────────────────────────
export function usePlayStyleDefinitions(position?: Position) {
  return useQuery<PlayStyleDefinition[]>({
    queryKey: ['play-styles', position],
    queryFn: () =>
      api
        .get('/reference-data/play-styles', { params: position ? { position } : undefined })
        .then((r) => r.data),
  });
}

export function useCreatePlayStyleDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlayStyleDefinitionDto) =>
      api.post('/reference-data/play-styles', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-styles'] }),
  });
}

export function useUpdatePlayStyleDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePlayStyleDefinitionDto & { id: string }) =>
      api.patch(`/reference-data/play-styles/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-styles'] }),
  });
}

export function useDeletePlayStyleDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reference-data/play-styles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-styles'] }),
  });
}
