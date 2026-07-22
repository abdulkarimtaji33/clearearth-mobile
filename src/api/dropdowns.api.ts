import { apiClient } from './client';
import type { ApiEnvelope, DropdownOption } from './types';

/** Public endpoint — no auth required, but works fine authenticated too. */
export async function fetchDropdownCategory(category: string): Promise<DropdownOption[]> {
  const res = await apiClient.get<ApiEnvelope<DropdownOption[]>>(`/dropdowns/category/${category}`);
  return res.data.data;
}
