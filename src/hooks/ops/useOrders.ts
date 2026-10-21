import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import * as api from '@/api/ops/orders.api';
import type { OrderDetailData, OrderKind, OrderListParams } from '@/api/ops/types';
import { usePaginated } from './usePaginated';

export function useOrders(kind: OrderKind, params: Omit<OrderListParams, 'page'>) {
  return usePaginated(opsKeys.orderList(kind, params), (page) =>
    api.fetchOrders(kind, { ...params, page, pageSize: 20 })
  );
}

export function useOrderDetail(kind: OrderKind, id: number) {
  return useQuery<OrderDetailData>({
    queryKey: opsKeys.order(kind, id),
    queryFn: () => (kind === 'service' ? api.fetchServiceOrder(id) : api.fetchPurchaseOrder(id)),
    enabled: Number.isFinite(id),
  });
}

function useInvalidateOrders() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: opsKeys.orders });
    qc.invalidateQueries({ queryKey: opsKeys.overview });
  };
}

export function useConfirmPickup() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: OrderKind; id: number }) => api.confirmPickupDate(kind, id),
    onSettled: invalidate,
  });
}

export function useRequestReschedule() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ kind, id, note }: { kind: OrderKind; id: number; note?: string }) =>
      api.requestPickupReschedule(kind, id, note),
    onSettled: invalidate,
  });
}
