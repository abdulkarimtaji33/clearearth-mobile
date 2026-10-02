import { apiClient } from './client';
import type {
  ApiEnvelope,
  InspectionDealSummary,
  InspectionListParams,
  InspectionRequest,
  InspectionRequestStatus,
  PaginatedEnvelope,
  SaveInspectionReportPayload,
  UploadResponse,
} from './types';

export async function fetchInspectionRequests(
  params: InspectionListParams
): Promise<PaginatedEnvelope<InspectionRequest>> {
  const res = await apiClient.get<PaginatedEnvelope<InspectionRequest>>('/inspection-requests', { params });
  return res.data;
}

export async function fetchInspectionRequest(id: number): Promise<InspectionRequest> {
  const res = await apiClient.get<ApiEnvelope<InspectionRequest>>(`/inspection-requests/${id}`);
  return res.data.data;
}

export async function acceptInspectionRequest(id: number): Promise<InspectionRequest> {
  const res = await apiClient.post<ApiEnvelope<InspectionRequest>>(`/inspection-requests/${id}/accept`);
  return res.data.data;
}

export async function rejectInspectionRequest(id: number, reason: string): Promise<InspectionRequest> {
  const res = await apiClient.post<ApiEnvelope<InspectionRequest>>(`/inspection-requests/${id}/reject`, { reason });
  return res.data.data;
}

export async function updateInspectionStatus(
  id: number,
  status: InspectionRequestStatus
): Promise<InspectionRequest> {
  const res = await apiClient.patch<ApiEnvelope<InspectionRequest>>(`/inspection-requests/${id}/status`, { status });
  return res.data.data;
}

export async function saveInspectionReport(
  dealId: number,
  payload: SaveInspectionReportPayload
): Promise<InspectionDealSummary> {
  const res = await apiClient.put<ApiEnvelope<InspectionDealSummary>>(`/deals/${dealId}/inspection-report`, payload);
  return res.data.data;
}

/** Uploads one photo for an inspection report; returns the relative path to put in `images[]`. */
export async function uploadInspectionImage(
  photo: { uri: string; name: string; type: string },
  onUploadProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', photo as unknown as Blob);
  const res = await apiClient.post<ApiEnvelope<UploadResponse>>('/upload/deal-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onUploadProgress || !event.total) return;
      onUploadProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return res.data.data;
}
