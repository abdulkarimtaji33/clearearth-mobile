import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '@/hooks/ops/useOrders';
import { useDebounce } from '@/hooks/ops/useDebounce';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { ChipRow, SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderCard } from '@/components/ops/OrderCard';
import type { OrderKind, OrderRow } from '@/api/ops/types';
import type { OpsStackParamList, OpsTabParamList, OrderFilter } from '@/navigation/types';

const KINDS: { key: OrderKind; label: string }[] = [
  { key: 'service', label: 'Service' },
  { key: 'client_po', label: 'Client POs' },
  { key: 'vendor_po', label: 'Vendor POs' },
];

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'needs_wo', label: 'Needs work order' },
  { key: 'has_wo', label: 'Has work order' },
  { key: 'all', label: 'All' },
];

export function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const route = useRoute<RouteProp<OpsTabParamList, 'Orders'>>();
  const [kind, setKind] = useState<OrderKind>('service');
  const [filter, setFilter] = useState<OrderFilter>('needs_wo');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  useEffect(() => {
    if (route.params?.kind) setKind(route.params.kind);
    if (route.params?.filter) setFilter(route.params.filter);
  }, [route.params?.kind, route.params?.filter]);

  const list = useOrders(kind, {
    search: debounced.trim() || undefined,
    hasWorkOrder: filter === 'all' ? undefined : filter === 'has_wo',
  });
  useRefreshOnFocus(list.refetch);

  const open = useCallback((o: OrderRow) => navigation.navigate('OrderDetail', { kind: o.kind, id: o.id }), [navigation]);
  const create = useCallback((o: OrderRow) => navigation.navigate('CreateWorkOrder', { kind: o.kind, orderId: o.id }), [navigation]);
  const openWo = useCallback((id: number) => navigation.navigate('WorkOrderDetail', { id }), [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: OrderRow; index: number }) => (
      <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 35)}>
        <OrderCard order={item} onOpen={open} onCreateWorkOrder={create} onOpenWorkOrder={openWo} />
      </Animated.View>
    ),
    [open, create, openWo]
  );

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="Orders" subtitle="Approved orders ready for operations" />
      <View className="px-5 pt-3">
        <SegmentedControl options={KINDS} value={kind} onChange={setKind} />
      </View>
      <View className="px-5 pt-3 pb-2.5">
        <SearchBar value={search} onChangeText={setSearch} placeholder={kind === 'service' ? 'Search by deal...' : 'Search by company...'} />
      </View>
      <View className="pb-3">
        <ChipRow options={FILTERS} value={filter} onChange={(k) => setFilter(k ?? 'all')} />
      </View>

      {list.isLoading ? (
        <View className="px-5" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </View>
      ) : list.isError ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load orders"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => list.refetch()} />}
        />
      ) : (
        <FlatList
          data={list.rows}
          keyExtractor={(o) => `${o.kind}-${o.id}`}
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
              icon={<Ionicons name={search ? 'search-outline' : 'checkmark-done-outline'} size={40} color="#94A3B8" />}
              title={search ? 'No matching orders' : filter === 'needs_wo' ? 'Nothing waiting for a work order' : 'No orders here'}
              description={search ? 'Try a different search.' : filter === 'needs_wo' ? 'Every approved order already has a work order.' : undefined}
            />
          }
        />
      )}
    </View>
  );
}
