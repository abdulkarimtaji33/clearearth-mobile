import { apiClient } from './client';
import type { ApiEnvelope, CurrentUserResponse, LoginResponse } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', { email, password });
  return res.data.data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const res = await apiClient.get<ApiEnvelope<CurrentUserResponse>>('/auth/me');
  const data = res.data.data as unknown as Omit<CurrentUserResponse, 'role'> & { role: string | { name: string } };
  // /auth/me returns role as an object ({ id, name, displayName }) while /auth/login returns the
  // role name string. Normalize so the rest of the app can rely on `role: string`.
  const role = typeof data.role === 'object' && data.role ? data.role.name : (data.role as string);
  return { ...data, role } as CurrentUserResponse;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/auth/change-password', { currentPassword, newPassword });
}
