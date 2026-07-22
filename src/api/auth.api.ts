import { apiClient } from './client';
import type { ApiEnvelope, CurrentUserResponse, LoginResponse } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', { email, password });
  return res.data.data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const res = await apiClient.get<ApiEnvelope<CurrentUserResponse>>('/auth/me');
  return res.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/auth/change-password', { currentPassword, newPassword });
}
