import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { PaginatedEnvelope } from '@/api/types';

/**
 * Infinite-scroll wrapper around the backend's `{ data, pagination }` envelope.
 * Returns the flattened rows plus the total count and `loadMore` for FlatList.onEndReached.
 */
export function usePaginated<T>(
  queryKey: QueryKey,
  fetchPage: (page: number) => Promise<PaginatedEnvelope<T>>,
  options: { enabled?: boolean } = {}
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: options.enabled ?? true,
  });

  const rows = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.pagination.totalItems ?? 0;

  return {
    ...query,
    rows,
    total,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
  };
}
