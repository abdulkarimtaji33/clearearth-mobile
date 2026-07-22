import { apiClient } from './client';
import type {
  ApiEnvelope,
  CompletePickupPayload,
  CompletePickupResponse,
  PickupDetail,
  PickupListItem,
  StartPickupResponse,
} from './types';

export async function fetchPickups(): Promise<PickupListItem[]> {
  const res = await apiClient.get<ApiEnvelope<PickupListItem[]>>('/driver/pickups');
  return res.data.data;
}

export async function fetchPickupDetail(taskId: number): Promise<PickupDetail> {
  const res = await apiClient.get<ApiEnvelope<PickupDetail>>(`/driver/pickups/${taskId}`);
  return res.data.data;
}

export async function startPickup(taskId: number): Promise<StartPickupResponse> {
  const res = await apiClient.post<ApiEnvelope<StartPickupResponse>>(`/driver/pickups/${taskId}/start`);
  return res.data.data;
}

export async function completePickup(
  taskId: number,
  payload: CompletePickupPayload,
  onUploadProgress?: (percent: number) => void
): Promise<CompletePickupResponse> {
  const form = new FormData();
  if (payload.quantity) form.append('quantity', payload.quantity);
  if (payload.uom) form.append('uom', payload.uom);
  if (payload.condition) form.append('condition', payload.condition);
  if (payload.remarks) form.append('remarks', payload.remarks);
  (payload.photos ?? []).forEach((photo) => {
    // React Native FormData file shape: { uri, name, type }
    form.append('photos', photo as unknown as Blob);
  });

  const res = await apiClient.post<ApiEnvelope<CompletePickupResponse>>(
    `/driver/pickups/${taskId}/complete`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );
  return res.data.data;
}
