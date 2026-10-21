import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/ops/common.api';
import type { NotificationsResponse } from '@/api/ops/types';

export function useNotifications() {
  return useQuery({
    queryKey: opsKeys.notifications,
    queryFn: () => fetchNotifications(50),
    staleTime: 15_000,
  });
}

/** Optimistically flips read state, rolling back on failure. */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: opsKeys.notifications });
      const prev = qc.getQueryData<NotificationsResponse>(opsKeys.notifications);
      if (prev) {
        const target = prev.notifications.find((n) => n.id === id);
        qc.setQueryData<NotificationsResponse>(opsKeys.notifications, {
          notifications: prev.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
          unreadCount: target && !target.is_read ? Math.max(prev.unreadCount - 1, 0) : prev.unreadCount,
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(opsKeys.notifications, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: opsKeys.notifications }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: opsKeys.notifications });
      const prev = qc.getQueryData<NotificationsResponse>(opsKeys.notifications);
      if (prev) {
        qc.setQueryData<NotificationsResponse>(opsKeys.notifications, {
          notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(opsKeys.notifications, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: opsKeys.notifications }),
  });
}
