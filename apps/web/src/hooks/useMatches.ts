import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UpdateMatchDto } from '@vcm/shared';

export function useUpdateMatch(matchId: string, competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMatchDto) =>
      api.patch(`/matches/${matchId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['competitions', competitionId],
      });
    },
  });
}
