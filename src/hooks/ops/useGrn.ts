import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import * as api from '@/api/ops/grn.api';
import type { GrnItemInput } from '@/api/ops/types';
import { usePaginated } from './usePaginated';
import type { UploadFile } from '@/lib/upload';

export function useGrns(params: Omit<api.GrnListParams, 'page'>) {
  return usePaginated(opsKeys.grnList(params), (page) => api.fetchGrns({ ...params, page, pageSize: 20 }));
}

export function useGrn(id: number) {
  return useQuery({ queryKey: opsKeys.grn(id), queryFn: () => api.fetchGrn(id), enabled: Number.isFinite(id) });
}

export function useStockOnHand() {
  return useQuery({ queryKey: opsKeys.stock, queryFn: api.fetchStockOnHand, staleTime: 30_000 });
}

export function useInventoryItems(params: Omit<api.InventoryListParams, 'page'>) {
  return usePaginated(opsKeys.inventoryList(params), (page) =>
    api.fetchInventoryItems({ ...params, page, pageSize: 25 })
  );
}

function useInvalidateGrn(id?: number) {
  const qc = useQueryClient();
  return (opts: { stock?: boolean } = {}) => {
    if (id !== undefined) qc.invalidateQueries({ queryKey: opsKeys.grn(id) });
    qc.invalidateQueries({ queryKey: [...opsKeys.grns, 'list'] });
    qc.invalidateQueries({ queryKey: opsKeys.overview });
    if (opts.stock) {
      qc.invalidateQueries({ queryKey: opsKeys.stock });
      qc.invalidateQueries({ queryKey: ['ops', 'inventory'] });
    }
  };
}

export function useUpdateGrn(id: number) {
  const invalidate = useInvalidateGrn(id);
  return useMutation({
    mutationFn: (payload: api.UpdateGrnPayload) => api.updateGrn(id, payload),
    onSettled: () => invalidate(),
  });
}

export function useApproveGrn(id: number) {
  const invalidate = useInvalidateGrn(id);
  return useMutation({
    mutationFn: () => api.approveGrn(id),
    onSettled: () => invalidate({ stock: true }),
  });
}

export function useUploadGrnItemImages(grnId: number) {
  const invalidate = useInvalidateGrn(grnId);
  return useMutation({
    mutationFn: ({ itemId, files, onProgress }: { itemId: number; files: UploadFile[]; onProgress?: (p: number) => void }) =>
      api.uploadGrnItemImages(grnId, itemId, files, onProgress),
    onSettled: () => invalidate(),
  });
}

export function useCreateGrn() {
  const invalidate = useInvalidateGrn();
  return useMutation({
    mutationFn: ({ workOrderId, items }: { workOrderId: number; items?: GrnItemInput[] }) =>
      api.createGrn(workOrderId, items),
    onSettled: () => invalidate(),
  });
}
