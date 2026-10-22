import { apiClient } from '@/api/client';
import type { ApiEnvelope, PaginatedEnvelope } from '@/api/types';
import type {
  CertificateRequestRow,
  CertificateRow,
  DealDetail,
  DealListItem,
  LeaveRequestRow,
  LeaveStatus,
} from './types';

/* --------------------------------- Deals ----------------------------------- */

export interface DealListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function fetchDeals(params: DealListParams): Promise<PaginatedEnvelope<DealListItem>> {
  const res = await apiClient.get<PaginatedEnvelope<DealListItem>>('/deals', { params });
  return res.data;
}

export async function fetchDeal(id: number): Promise<DealDetail> {
  const res = await apiClient.get<ApiEnvelope<DealDetail>>(`/deals/${id}`);
  return res.data.data;
}

export interface CollectionDetailsPayload {
  pickupLocation?: string | null;
  pickupContactName?: string | null;
  pickupContactNumber?: string | null;
}

export async function updateCollectionDetails(id: number, payload: CollectionDetailsPayload): Promise<void> {
  await apiClient.patch(`/deals/${id}/collection-details`, payload);
}

export interface LocationShareLink {
  shareUrl: string;
  expiresAt: string;
}

/** Unlike most endpoints this one returns { shareUrl, expiresAt } at the top level (no `data`). */
export async function createLocationShareToken(dealId: number): Promise<LocationShareLink> {
  const res = await apiClient.post<{ success: boolean } & LocationShareLink>(`/location-share/deals/${dealId}/token`);
  return { shareUrl: res.data.shareUrl, expiresAt: res.data.expiresAt };
}

/* ------------------------------- Certificates ------------------------------- */

export interface CertificateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function fetchCertificateRequests(
  params: CertificateListParams
): Promise<PaginatedEnvelope<CertificateRequestRow>> {
  const res = await apiClient.get<PaginatedEnvelope<CertificateRequestRow>>('/certificate-requests', { params });
  return res.data;
}

export async function fetchCertificates(params: CertificateListParams): Promise<PaginatedEnvelope<CertificateRow>> {
  const res = await apiClient.get<PaginatedEnvelope<CertificateRow>>('/certificates', { params });
  return res.data;
}

/* ---------------------------------- Leave ---------------------------------- */

export async function fetchLeaveRequests(status?: LeaveStatus): Promise<LeaveRequestRow[]> {
  const res = await apiClient.get<ApiEnvelope<LeaveRequestRow[]>>('/hr/leave/requests', {
    params: { status, pageSize: 100 },
  });
  return res.data.data;
}

export async function approveLeave(id: number): Promise<void> {
  await apiClient.post(`/hr/leave/requests/${id}/approve`);
}

export async function rejectLeave(id: number, reason: string): Promise<void> {
  await apiClient.post(`/hr/leave/requests/${id}/reject`, { reason });
}
