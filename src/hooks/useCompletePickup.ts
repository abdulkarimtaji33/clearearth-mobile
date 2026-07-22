import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completePickup } from '@/api/driver.api';
import { queryKeys } from '@/api/queryClient';
import type { CompletePickupPayload } from '@/api/types';

export function useCompletePickup(taskId: number, onUploadProgress?: (percent: number) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompletePickupPayload) => completePickup(taskId, payload, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pickup(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pickups });
    },
  });
}
