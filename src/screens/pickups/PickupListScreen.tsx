import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/hooks/AuthContext';
import { usePickups } from '@/hooks/usePickups';
import { Avatar } from '@/components/ui/Avatar';
import { PickupCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SummaryTiles } from '@/components/pickups/SummaryTiles';
import { FilterTabs } from '@/components/pickups/FilterTabs';
import { PickupCard } from '@/components/pickups/PickupCard';
import { greetingForNow } from '@/constants/statusConfig';
import type { PickupPriority } from '@/api/types';
import type { AppStackParamList } from '@/navigation/types';

export function PickupListScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data, isLoading, isError, refetch, isRefetching } = usePickups();
  const [filter, setFilter] = useState<PickupPriority | 'all'>('all');

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const counts = useMemo(() => {
    const base: Record<PickupPriority, number> = { overdue: 0, today: 0, upcoming: 0, completed: 0 };
    (data ?? []).forEach((p) => {
      base[p.priority] = (base[p.priority] ?? 0) + 1;
    });
    return base;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    return data.filter((p) => p.priority === filter);
  }, [data, filter]);

  const greeting = greetingForNow();
  const firstName = user?.firstName ?? 'Driver';

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-5">
        <View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">{greeting},</Text>
          <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">{firstName} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut} hitSlop={10}>
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="px-5">
          <PickupCardSkeleton />
          <PickupCardSkeleton />
          <PickupCardSkeleton />
        </View>
      ) : isError ? (
        <EmptyState
          title="Couldn't load your pickups"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.taskId)}
          ListHeaderComponent={
            <View className="mb-5">
              <SummaryTiles counts={counts} active={filter} onSelect={setFilter} />
              <View className="h-4" />
              <FilterTabs active={filter} onSelect={setFilter} total={data?.length ?? 0} />
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 8) * 40)}>
              <PickupCard pickup={item} onPress={() => navigation.navigate('PickupDetail', { taskId: item.taskId })} />
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'all' ? 'No pickups assigned' : `No ${filter} pickups`}
              description={
                filter === 'all'
                  ? "You're all caught up — new pickups will show up here."
                  : 'Try a different filter to see other pickups.'
              }
            />
          }
        />
      )}
    </View>
  );
}
