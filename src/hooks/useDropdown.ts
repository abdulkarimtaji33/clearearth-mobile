import { useQuery } from '@tanstack/react-query';
import { fetchDropdownCategory } from '@/api/dropdowns.api';
import { queryKeys } from '@/api/queryClient';

const FALLBACK_UOM = ['kg', 'ton', 'MT', 'liter', 'm3', 'pcs', 'bag', 'drum'];

export function useUomOptions() {
  const query = useQuery({
    queryKey: queryKeys.dropdown('units_of_measure'),
    queryFn: () => fetchDropdownCategory('units_of_measure'),
    staleTime: 5 * 60_000,
    retry: 0,
  });

  const options = query.data?.length
    ? query.data.map((o) => o.value)
    : FALLBACK_UOM;

  return { options, isLoading: query.isLoading };
}
