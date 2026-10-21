import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkOrders } from '@/hooks/ops/useWorkOrders';
import { useDebounce } from '@/hooks/ops/useDebounce';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { ChipRow } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { WorkOrderCard } from '@/components/ops/WorkOrderCard';
import type { WorkOrderListItem, WorkOrderListParams } from '@/api/ops/types';
import type { OpsStackParamList, OpsTabParamList, WorkFilter } from '@/navigation/types';

const FILTERS: { key: WorkFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'new', label: 'New' },
  { key: 'completed', label: 'Completed' },
];

function paramsFor(filter: WorkFilter, search: string): Omit<WorkOrderListParams, 'page'> {
  const base: Omit<WorkOrderListParams, 'page'> = { search: search || undefined };
  switch (filter) {
    case 'overdue':
      return { ...base, overdue: true, sort: 'due' };
    case 'unassigned':
      return { ...base, unassigned: true };
    case 'in_progress':
    case 'new':
    case 'completed':
      return { ...base, status: filter };
    default:
      return base;
  }
}

export function WorkListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const route = useRoute<RouteProp<OpsTabParamList, 'Work'>>();
  const [filter, setFilter] = useState<WorkFilter>('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  // KPI tiles on Home deep-link here with a preselected filter.
  useEffect(() => {
    if (route.params?.filter) setFilter(route.params.filter);
  }, [route.params?.filter]);

  const list = useWorkOrders(paramsFor(filter, debounced.trim()));
  useRefreshOnFocus(list.refetch);

  const open = useCallback((id: number) => navigation.navigate('WorkOrderDetail', { id }), [navigation]);
  const renderItem = useCallback(
    ({ item, index }: { item: WorkOrderListItem; index: number }) => (
      <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 35)}>
        <WorkOrderCard workOrder={item} onPress={open} />
      </Animated.View>
    ),
    [open]
  );

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="Work orders" subtitle={list.total ? `${list.total} total` : undefined} />
      <View className="px-5 pt-3 pb-2.5">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search work orders..." />
      </View>
      <View className="pb-3">
        <ChipRow options={FILTERS} value={filter} onChange={(k) => setFilter(k ?? 'all')} />
      </View>

      {list.isLoading ? (
        <View className="px-5" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </View>
      ) : list.isError ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load work orders"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => list.refetch()} />}
        />
      ) : (
        <FlatList
          data={list.rows}
          keyExtractor={(w) => String(w.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={list.refetch} tintColor="#10B981" />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color="#10B981" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name={search ? 'search-outline' : 'construct-outline'} size={40} color="#94A3B8" />}
              title={search ? 'No matching work orders' : filter === 'all' ? 'No work orders yet' : 'Nothing here'}
              description={
                search
                  ? 'Try a different search.'
                  : filter === 'all'
                    ? 'Create one from an approved order on the Orders tab.'
                    : 'No work orders match this filter.'
              }
            />
          }
        />
      )}
    </View>
  );
}
