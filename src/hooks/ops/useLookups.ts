import { useQuery } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import { fetchAssignees, fetchMaterialTypes, fetchWorkTypes } from '@/api/ops/common.api';

const FIVE_MIN = 5 * 60_000;

export function useAssignees() {
  return useQuery({ queryKey: opsKeys.assignees, queryFn: fetchAssignees, staleTime: FIVE_MIN });
}

export function useWorkTypes() {
  return useQuery({ queryKey: opsKeys.workTypes, queryFn: fetchWorkTypes, staleTime: FIVE_MIN });
}

export function useMaterialTypes() {
  return useQuery({ queryKey: opsKeys.materialTypes, queryFn: fetchMaterialTypes, staleTime: FIVE_MIN });
}
