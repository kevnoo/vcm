import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PlayerValueBreakdown } from '@vcm/shared';

export function usePlayerValue(playerId: string) {
  return useQuery<PlayerValueBreakdown>({
    queryKey: ['players', playerId, 'value'],
    queryFn: () => api.get(`/players/${playerId}/value`).then((r) => r.data),
    enabled: !!playerId,
  });
}
