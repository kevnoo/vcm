import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PosCheckoutDto } from '@vcm/shared';

export function usePosCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PosCheckoutDto) =>
      api.post('/admin/pos/checkout', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
