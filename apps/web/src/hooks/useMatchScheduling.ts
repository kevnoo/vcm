import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  MatchHub,
  CreateMatchMessageDto,
  CreateTimeProposalDto,
  RespondTimeProposalDto,
} from '@vcm/shared';

export function useMatchHub(matchId: string) {
  return useQuery<MatchHub>({
    queryKey: ['match-hub', matchId],
    queryFn: () =>
      api.get(`/matches/${matchId}/scheduling`).then((r) => r.data),
    enabled: !!matchId,
  });
}

export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMatchMessageDto) =>
      api
        .post(`/matches/${matchId}/scheduling/messages`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-hub', matchId] });
    },
  });
}

export function useProposeTime(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeProposalDto) =>
      api
        .post(`/matches/${matchId}/scheduling/time-proposals`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-hub', matchId] });
    },
  });
}

export function useRespondToProposal(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      ...data
    }: RespondTimeProposalDto & { proposalId: string }) =>
      api
        .patch(
          `/matches/${matchId}/scheduling/time-proposals/${proposalId}`,
          data,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-hub', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}

export function useAdminSetTime(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeProposalDto) =>
      api
        .patch(`/matches/${matchId}/scheduling/set-time`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-hub', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}
