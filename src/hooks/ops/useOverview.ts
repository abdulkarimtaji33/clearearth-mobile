import { useQuery } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import { fetchOverview } from '@/api/ops/common.api';

/** Dashboard payload: also drives the tab-bar badges, so it's shared via the query cache. */
export function useOverview() {
  return useQuery({
    queryKey: opsKeys.overview,
    queryFn: fetchOverview,
    staleTime: 20_000,
  });
}
