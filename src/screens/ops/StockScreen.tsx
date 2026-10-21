import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGrns, useInventoryItems, useStockOnHand } from '@/hooks/ops/useGrn';
import { useDebounce } from '@/hooks/ops/useDebounce';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { ChipRow, SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { GrnCard } from '@/components/ops/GrnCard';
import { GRN_STATUS } from '@/constants/opsStatus';
import { formatQty, relativeTime } from '@/lib/opsFormat';
import type { GrnStatus, InventoryItemRow, StockRow } from '@/api/ops/types';
import type { OpsStackParamList, OpsTabParamList } from '@/navigation/types';

type Segment = 'grn' | 'inventory';
type StatusFilter = GrnStatus | 'all';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
];

function StockCard({ row }: { row: StockRow }) {
  return (
    <View
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4"
      style={{ width: 168, shadowColor: '#0A1628', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center mb-2.5">
        <Ionicons name="cube" size={18} color="#059669" />
      </View>
      <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
        {row.materialType?.displayName ?? 'Unclassified'}
      </Text>
      <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 mt-0.5" style={{ fontVariant: ['tabular-nums'] }}>
        {row.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </Text>
      <Text className="text-xs font-semibold text-neutral-500">{row.unitOfMeasure ?? ''}</Text>
      <Text className="text-[11px] text-neutral-400 mt-2">Updated {relativeTime(row.lastUpdated)}</Text>
    </View>
  );
}

export function StockScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const route = useRoute<RouteProp<OpsTabParamList, 'Stock'>>();
  const [segment, setSegment] = useState<Segment>('grn');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  useEffect(() => {
    if (route.params?.segment) setSegment(route.params.segment);
    if (route.params?.status) setStatus(route.params.status);
  }, [route.params?.segment, route.params?.status]);

  const grns = useGrns({ search: debounced.trim() || undefined, status: status === 'all' ? undefined : status });
  const stock = useStockOnHand();
  const inventory = useInventoryItems({ search: debounced.trim() || undefined });
  const active = segment === 'grn' ? grns : inventory;

  useRefreshOnFocus(() => {
    grns.refetch();
    stock.refetch();
    inventory.refetch();
  });

  const openGrn = useCallback((id: number) => navigation.navigate('GrnDetail', { id }), [navigation]);

  const renderGrn = useCallback(
    ({ item, index }: { item: (typeof grns.rows)[number]; index: number }) => (
      <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 35)}>
        <GrnCard grn={item} onPress={openGrn} />
      </Animated.View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openGrn]
  );

  const renderItem = useCallback(
    ({ item }: { item: InventoryItemRow }) => (
      <Pressable
        onPress={() => item.grn && openGrn(item.grn.id)}
        accessibilityRole="button"
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-2.5 active:opacity-90"
      >
        <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
          <View className="flex-1">
            <Text className="text-[15px] font-extrabold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
              {item.item_name}
            </Text>
            <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>
              {[item.materialType?.display_name, item.make, item.model].filter(Boolean).join(' · ') || 'No details'}
            </Text>
          </View>
          <Text className="text-base font-extrabold text-primary-700 dark:text-primary-300">{formatQty(item.quantity, item.unit_of_measure)}</Text>
        </View>
        {item.grn ? (
          <View className="flex-row items-center justify-between mt-2.5">
            <Text className="text-xs text-neutral-500" numberOfLines={1}>
              {item.grn.grn_number} · {item.grn.deal?.company?.company_name ?? item.grn.deal?.title ?? ''}
            </Text>
            <StatusPill meta={GRN_STATUS[item.grn.status]} />
          </View>
        ) : null}
      </Pressable>
    ),
    [openGrn]
  );

  const header = (
    <View>
      {segment === 'inventory' ? (
        <View className="mb-5">
          <SectionHeader title="Stock on hand" padded={false} />
          {stock.isLoading ? (
            <Skeleton className="h-36 rounded-2xl" />
          ) : (stock.data ?? []).length === 0 ? (
            <View className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 items-center">
              <Text className="text-sm text-neutral-500 text-center">Nothing in stock yet. Approving a GRN adds its materials here.</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={stock.data}
              keyExtractor={(r) => String(r.id)}
              renderItem={({ item }) => <StockCard row={item} />}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }}
            />
          )}
          <View className="mt-5">
            <SectionHeader title="Received items" count={inventory.total || undefined} padded={false} />
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="Stock" subtitle="Goods received and inventory" />
      <View className="px-5 pt-3">
        <SegmentedControl
          options={[
            { key: 'grn' as const, label: 'GRNs' },
            { key: 'inventory' as const, label: 'Inventory' },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>
      <View className="px-5 pt-3 pb-2.5">
        <SearchBar value={search} onChangeText={setSearch} placeholder={segment === 'grn' ? 'Search GRN or deal...' : 'Search items, make, serial...'} />
      </View>
      {segment === 'grn' ? (
        <View className="pb-3">
          <ChipRow options={STATUS_FILTERS} value={status} onChange={(k) => setStatus(k ?? 'all')} />
        </View>
      ) : null}

      {active.isLoading ? (
        <View className="px-5" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </View>
      ) : active.isError ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this list"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => active.refetch()} />}
        />
      ) : segment === 'grn' ? (
        <FlatList
          key="grn"
          data={grns.rows}
          keyExtractor={(g) => String(g.id)}
          renderItem={renderGrn}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={grns.isRefetching && !grns.isFetchingNextPage} onRefresh={grns.refetch} tintColor="#10B981" />}
          onEndReached={grns.loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={grns.isFetchingNextPage ? <ActivityIndicator color="#10B981" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name={search ? 'search-outline' : 'cube-outline'} size={40} color="#94A3B8" />}
              title={search ? 'No matching GRNs' : 'No GRNs here'}
              description={search ? 'Try a different search.' : 'A GRN is created automatically when a work order is completed.'}
            />
          }
        />
      ) : (
        <FlatList
          key="inventory"
          data={inventory.rows}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={inventory.isRefetching && !inventory.isFetchingNextPage} onRefresh={() => { inventory.refetch(); stock.refetch(); }} tintColor="#10B981" />}
          onEndReached={inventory.loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={10}
          windowSize={7}
          ListFooterComponent={inventory.isFetchingNextPage ? <ActivityIndicator color="#10B981" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name={search ? 'search-outline' : 'layers-outline'} size={40} color="#94A3B8" />}
              title={search ? 'No matching items' : 'No received items yet'}
            />
          }
        />
      )}
    </View>
  );
}
