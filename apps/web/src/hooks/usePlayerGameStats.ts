import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  MatchPlayerGameStats,
  SubmitGameStatsDto,
  ConfirmGameStatsDto,
  DisputeStatFieldDto,
  ResolveStatDisputeDto,
  PlayerSeasonStats,
  LeaderboardEntry,
} from '@vcm/shared';

export function useMatchGameStats(matchId: string) {
  return useQuery<MatchPlayerGameStats[]>({
    queryKey: ['match-game-stats', matchId],
    queryFn: () =>
      api.get(`/matches/${matchId}/game-stats`).then((r) => r.data),
    enabled: !!matchId,
  });
}

export function useSubmitGameStats(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitGameStatsDto) =>
      api.post(`/matches/${matchId}/game-stats`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats', matchId] });
    },
  });
}

export function useConfirmGameStats(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmGameStatsDto) =>
      api.patch(`/matches/${matchId}/game-stats/confirm`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats', matchId] });
    },
  });
}

export function useUpdateGameStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameStatsId, ...data }: { gameStatsId: string; minutesPlayed?: number }) =>
      api.patch(`/game-stats/${gameStatsId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats'] });
    },
  });
}

export function useDisputeStatField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameStatsId, ...data }: DisputeStatFieldDto & { gameStatsId: string }) =>
      api.post(`/game-stats/${gameStatsId}/disputes`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stat-disputes'] });
    },
  });
}

export function useResolveStatDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, ...data }: ResolveStatDisputeDto & { disputeId: string }) =>
      api.patch(`/stat-disputes/${disputeId}/resolve`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-game-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stat-disputes'] });
    },
  });
}

export function useStatDisputes() {
  return useQuery({
    queryKey: ['stat-disputes'],
    queryFn: () => api.get('/admin/stat-disputes').then((r) => r.data),
  });
}

export function usePlayerSeasonStats(playerId: string, competitionId: string) {
  return useQuery<PlayerSeasonStats | null>({
    queryKey: ['player-season-stats', playerId, competitionId],
    queryFn: () =>
      api.get(`/players/${playerId}/stats/season?competitionId=${competitionId}`).then((r) => r.data),
    enabled: !!playerId && !!competitionId,
  });
}

export function usePlayerCareerStats(playerId: string) {
  return useQuery<PlayerSeasonStats | null>({
    queryKey: ['player-career-stats', playerId],
    queryFn: () =>
      api.get(`/players/${playerId}/stats/career`).then((r) => r.data),
    enabled: !!playerId,
  });
}

interface CompetitionLeaders {
  topScorers: LeaderboardEntry[];
  topAssists: LeaderboardEntry[];
  topRated: LeaderboardEntry[];
  topCleanSheets: LeaderboardEntry[];
}

export function useCompetitionLeaders(competitionId: string) {
  return useQuery<CompetitionLeaders>({
    queryKey: ['competition-leaders', competitionId],
    queryFn: () =>
      api.get(`/competitions/${competitionId}/stats/leaders`).then((r) => r.data),
    enabled: !!competitionId,
  });
}
