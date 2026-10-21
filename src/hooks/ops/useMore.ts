import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import * as api from '@/api/ops/more.api';
import type { LeaveStatus } from '@/api/ops/types';
import { usePaginated } from './usePaginated';

export function useDeals(params: Omit<api.DealListParams, 'page'>) {
  return usePaginated(opsKeys.dealList(params), (page) => api.fetchDeals({ ...params, page, pageSize: 20 }));
}

export function useDeal(id: number | null | undefined) {
  return useQuery({
    queryKey: opsKeys.deal(id ?? 0),
    queryFn: () => api.fetchDeal(id as number),
    enabled: typeof id === 'number' && Number.isFinite(id),
  });
}

export function useUpdateCollectionDetails(dealId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.CollectionDetailsPayload) => api.updateCollectionDetails(dealId, payload),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: opsKeys.deal(dealId) });
      qc.invalidateQueries({ queryKey: [...opsKeys.deals, 'list'] });
    },
  });
}

export function useCertificateRequests(search: string, status: string | null, enabled: boolean) {
  return usePaginated(
    [...opsKeys.certificates, 'requests', { search, status }],
    (page) => api.fetchCertificateRequests({ page, pageSize: 20, search: search || undefined, status: status || undefined }),
    { enabled }
  );
}

export function useCertificates(search: string, enabled: boolean) {
  return usePaginated(
    [...opsKeys.certificates, 'register', { search }],
    (page) => api.fetchCertificates({ page, pageSize: 20, search: search || undefined }),
    { enabled }
  );
}

export function useLeaveRequests(status: LeaveStatus | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...opsKeys.leave, status ?? 'all'],
    queryFn: () => api.fetchLeaveRequests(status),
    enabled,
  });
}

export function useLeaveDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reject, reason }: { id: number; reject?: boolean; reason?: string }) =>
      reject ? api.rejectLeave(id, reason ?? '') : api.approveLeave(id),
    onSettled: () => qc.invalidateQueries({ queryKey: opsKeys.leave }),
  });
}
