import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  MatchStats,
  SaveLineupDto,
  SaveSubstitutionsDto,
  SavePlayerStatsDto,
} from '@vcm/shared';

export function useMatchStats(matchId: string) {
  return useQuery<MatchStats & { playerMinutes: { playerId: string; minutesPlayed: number }[] }>({
    queryKey: ['match-stats', matchId],
    queryFn: () =>
      api.get(`/matches/${matchId}/stats`).then((r) => r.data),
    enabled: !!matchId,
  });
}

export function useSaveLineup(matchId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveLineupDto) =>
      api
        .put(`/matches/${matchId}/stats/lineup/${teamId}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-stats', matchId] });
    },
  });
}

export function useSaveSubstitutions(matchId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveSubstitutionsDto) =>
      api
        .put(`/matches/${matchId}/stats/substitutions/${teamId}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-stats', matchId] });
    },
  });
}

export function useSavePlayerStats(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SavePlayerStatsDto) =>
      api
        .put(`/matches/${matchId}/stats/player-stats`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-stats', matchId] });
    },
  });
}
