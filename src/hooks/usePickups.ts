import { useQuery } from '@tanstack/react-query';
import { fetchPickups, fetchPickupDetail } from '@/api/driver.api';
import { queryKeys } from '@/api/queryClient';

export function usePickups() {
  return useQuery({
    queryKey: queryKeys.pickups,
    queryFn: fetchPickups,
  });
}

export function usePickupDetail(taskId: number) {
  return useQuery({
    queryKey: queryKeys.pickup(taskId),
    queryFn: () => fetchPickupDetail(taskId),
    enabled: Number.isFinite(taskId),
  });
}
