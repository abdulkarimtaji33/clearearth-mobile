import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startPickup } from '@/api/driver.api';
import { queryKeys } from '@/api/queryClient';
import type { PickupDetail, PickupListItem } from '@/api/types';

export function useStartPickup(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startPickup(taskId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pickup(taskId) });
      const previousDetail = queryClient.getQueryData<PickupDetail>(queryKeys.pickup(taskId));
      if (previousDetail) {
        queryClient.setQueryData<PickupDetail>(queryKeys.pickup(taskId), {
          ...previousDetail,
          taskStatus: 'in_progress',
          priority: previousDetail.priority === 'completed' ? previousDetail.priority : 'today',
        });
      }
      const previousList = queryClient.getQueryData<PickupListItem[]>(queryKeys.pickups);
      if (previousList) {
        queryClient.setQueryData<PickupListItem[]>(
          queryKeys.pickups,
          previousList.map((item) =>
            item.taskId === taskId ? { ...item, taskStatus: 'in_progress' as const } : item
          )
        );
      }
      return { previousDetail, previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.pickup(taskId), context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.pickups, context.previousList);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pickup(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pickups });
    },
  });
}
