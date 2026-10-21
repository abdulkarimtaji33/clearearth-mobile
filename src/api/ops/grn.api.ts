import { apiClient } from '@/api/client';
import type { ApiEnvelope, PaginatedEnvelope } from '@/api/types';
import { buildFileForm, multipartConfig, type UploadFile } from '@/lib/upload';
import type { Grn, GrnItemInput, GrnStatus, InventoryItemRow, StockRow } from './types';

export interface GrnListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: GrnStatus;
}

export async function fetchGrns(params: GrnListParams): Promise<PaginatedEnvelope<Grn>> {
  const res = await apiClient.get<PaginatedEnvelope<Grn>>('/grn', { params });
  return res.data;
}

export async function fetchGrn(id: number): Promise<Grn> {
  const res = await apiClient.get<ApiEnvelope<Grn>>(`/grn/${id}`);
  return res.data.data;
}

export async function createGrn(workOrderId: number, items: GrnItemInput[] = []): Promise<Grn> {
  const res = await apiClient.post<ApiEnvelope<Grn>>('/grn', { workOrderId, items });
  return res.data.data;
}

export interface UpdateGrnPayload {
  notes?: string | null;
  status?: GrnStatus;
  /** Full replace: omit to leave items untouched. Carry existing images so they survive. */
  items?: GrnItemInput[];
}

export async function updateGrn(id: number, payload: UpdateGrnPayload): Promise<Grn> {
  const res = await apiClient.patch<ApiEnvelope<Grn>>(`/grn/${id}`, payload);
  return res.data.data;
}

export async function approveGrn(id: number): Promise<Grn> {
  const res = await apiClient.post<ApiEnvelope<Grn>>(`/grn/${id}/approve`);
  return res.data.data;
}

export async function uploadGrnItemImages(
  grnId: number,
  itemId: number,
  files: UploadFile[],
  onProgress?: (percent: number) => void
): Promise<Grn> {
  const form = await buildFileForm('images', files);
  const res = await apiClient.post<ApiEnvelope<Grn>>(
    `/grn/${grnId}/items/${itemId}/images`,
    form,
    multipartConfig(onProgress)
  );
  return res.data.data;
}

export interface InventoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  materialTypeId?: number;
}

export async function fetchInventoryItems(params: InventoryListParams): Promise<PaginatedEnvelope<InventoryItemRow>> {
  const res = await apiClient.get<PaginatedEnvelope<InventoryItemRow>>('/grn/inventory', { params });
  return res.data;
}

export async function fetchStockOnHand(): Promise<StockRow[]> {
  const res = await apiClient.get<ApiEnvelope<StockRow[]>>('/grn/inventory/stock');
  return res.data.data;
}
