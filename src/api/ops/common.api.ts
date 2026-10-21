import { apiClient } from '@/api/client';
import type { ApiEnvelope, PaginatedEnvelope } from '@/api/types';
import type {
  Assignee,
  MaterialTypeOption,
  NotificationsResponse,
  OperationsOverview,
  WorkType,
} from './types';

export async function fetchOverview(): Promise<OperationsOverview> {
  const res = await apiClient.get<ApiEnvelope<OperationsOverview>>('/dashboard/overview');
  return res.data.data;
}

export async function fetchNotifications(limit = 50): Promise<NotificationsResponse> {
  const res = await apiClient.get<ApiEnvelope<NotificationsResponse>>('/notifications', { params: { limit } });
  return res.data.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

export async function registerPushToken(token: string, platform: string): Promise<void> {
  await apiClient.post('/notifications/push-token', { token, platform });
}

export async function removePushToken(token: string): Promise<void> {
  await apiClient.delete('/notifications/push-token', { data: { token } });
}

export async function fetchAssignees(): Promise<Assignee[]> {
  const res = await apiClient.get<ApiEnvelope<Assignee[]>>('/users/assignees');
  return res.data.data;
}

export async function fetchDrivers(): Promise<Assignee[]> {
  const res = await apiClient.get<ApiEnvelope<Assignee[]>>('/users/drivers');
  return res.data.data;
}

export async function fetchWorkTypes(): Promise<WorkType[]> {
  const res = await apiClient.get<ApiEnvelope<WorkType[]>>('/work-types');
  return res.data.data;
}

export async function createWorkType(name: string): Promise<WorkType> {
  const res = await apiClient.post<ApiEnvelope<WorkType>>('/work-types', { name });
  return res.data.data;
}

export async function updateWorkType(id: number, name: string): Promise<WorkType> {
  const res = await apiClient.put<ApiEnvelope<WorkType>>(`/work-types/${id}`, { name });
  return res.data.data;
}

export async function deleteWorkType(id: number): Promise<void> {
  await apiClient.delete(`/work-types/${id}`);
}

export async function fetchMaterialTypes(): Promise<MaterialTypeOption[]> {
  const res = await apiClient.get<ApiEnvelope<MaterialTypeOption[]>>('/material-types');
  return res.data.data;
}

/** Shared helper for the paginated endpoints. */
export async function getPage<T>(path: string, params: object): Promise<PaginatedEnvelope<T>> {
  const res = await apiClient.get<PaginatedEnvelope<T>>(path, { params });
  return res.data;
}
