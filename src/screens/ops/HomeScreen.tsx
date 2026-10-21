import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import { useOverview } from '@/hooks/ops/useOverview';
import { useNotifications } from '@/hooks/ops/useNotifications';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { useAssignTaskById } from '@/hooks/ops/useWorkOrders';
import { useConfirmPickup, useRequestReschedule } from '@/hooks/ops/useOrders';
import { Avatar } from '@/components/ui/Avatar';
import { KpiTile } from '@/components/ui/KpiTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { IconButton } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ActionCard, type CardAction } from '@/components/ops/ActionCard';
import { AssigneeSheet } from '@/components/ops/AssigneeSheet';
import { RescheduleSheet } from '@/components/ops/RescheduleSheet';
import { TASK_STATUS, WORK_ORDER_STATUS } from '@/constants/opsStatus';
import { greetingForNow } from '@/constants/statusConfig';
import { dueInfo } from '@/lib/opsFormat';
import { formatShortDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { toUserMessage } from '@/lib/errors';
import type { PendingPickupConfirmation, TaskStatus, WorkOrderStatus } from '@/api/ops/types';
import type { OpsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OpsStackParamList>;

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useOverview();
  const { data: notes } = useNotifications();
  useRefreshOnFocus(refetch);

  const confirmPickup = useConfirmPickup();
  const requestReschedule = useRequestReschedule();
  const assignTask = useAssignTaskById();

  const [assigning, setAssigning] = useState<{ workOrderId: number; taskId: number } | null>(null);
  const [rescheduling, setRescheduling] = useState<PendingPickupConfirmation | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  const firstName = user?.firstName ?? 'there';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const kpis = useMemo(() => {
    const c = data?.counts;
    const inProgress = data?.kpis.find((k) => k.label === 'Work orders in progress')?.value ?? 0;
    return [
      { label: 'In progress', value: inProgress, icon: 'construct' as const, onPress: () => navigation.navigate('Tabs', { screen: 'Work', params: { filter: 'in_progress' } }) },
      { label: 'Overdue tasks', value: c?.overdueTasks ?? 0, icon: 'alert-circle' as const, alert: (c?.overdueTasks ?? 0) > 0, onPress: () => navigation.navigate('Tabs', { screen: 'Work', params: { filter: 'overdue' } }) },
      { label: 'Need a work order', value: c?.ordersAwaitingWo ?? 0, icon: 'document-text' as const, onPress: () => navigation.navigate('Tabs', { screen: 'Orders', params: { filter: 'needs_wo' } }) },
      { label: 'GRNs to review', value: (c?.grnsNew ?? 0) + (c?.grnsSubmitted ?? 0), icon: 'cube' as const, onPress: () => navigation.navigate('Tabs', { screen: 'Stock', params: { segment: 'grn' } }) },
    ];
  }, [data, navigation]);

  async function handleConfirm(p: PendingPickupConfirmation) {
    const key = `${p.entityType}-${p.id}`;
    setConfirmingKey(key);
    try {
      await confirmPickup.mutateAsync({ kind: p.entityType === 'quotation' ? 'service' : 'client_po', id: p.id });
      haptic.success();
      toast.show('Pickup date confirmed. Sales has been notified.', 'success');
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    } finally {
      setConfirmingKey(null);
    }
  }

  async function handleReschedule(note: string) {
    if (!rescheduling) return;
    try {
      await requestReschedule.mutateAsync({
        kind: rescheduling.entityType === 'quotation' ? 'service' : 'client_po',
        id: rescheduling.id,
        note,
      });
      haptic.success();
      toast.show('Reschedule request sent to sales', 'success');
      setRescheduling(null);
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  async function handleAssign(ids: number[]) {
    if (!assigning) return;
    try {
      await assignTask.mutateAsync({ ...assigning, assigneeIds: ids });
      haptic.success();
      toast.show(ids.length ? 'Task assigned' : 'Task unassigned', 'success');
      setAssigning(null);
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  const needsYou = useMemo(() => {
    if (!data) return [];
    const items: React.ReactElement[] = [];

    data.pendingPickupConfirmations.forEach((p) => {
      const key = `${p.entityType}-${p.id}`;
      const actions: CardAction[] = [
        { label: 'Confirm date', primary: true, loading: confirmingKey === key, onPress: () => handleConfirm(p) },
        { label: 'Reschedule', onPress: () => setRescheduling(p) },
      ];
      items.push(
        <ActionCard
          key={`pickup-${key}`}
          icon="calendar"
          tone="today"
          title={`Confirm pickup ${p.requestedPickupDate ? formatShortDate(p.requestedPickupDate) : 'date'}`}
          subtitle={[p.dealTitle, p.partyName].filter(Boolean).join(' · ')}
          actions={actions}
          onPress={() => navigation.navigate('OrderDetail', { kind: p.entityType === 'quotation' ? 'service' : 'client_po', id: p.id })}
        />
      );
    });

    data.unassignedTasks.slice(0, 5).forEach((t) => {
      items.push(
        <ActionCard
          key={`unassigned-${t.taskId}`}
          icon="person-add"
          tone="upcoming"
          title={`Assign ${t.typeOfWork ?? 'task'}`}
          subtitle={[t.workOrderTitle, t.endDate ? dueInfo(t.endDate).label : null].filter(Boolean).join(' · ')}
          actions={[
            { label: 'Assign', primary: true, onPress: () => setAssigning({ workOrderId: t.workOrderId, taskId: t.taskId }) },
            { label: 'Open', onPress: () => navigation.navigate('WorkOrderDetail', { id: t.workOrderId, openTaskId: t.taskId }) },
          ]}
        />
      );
    });

    [...data.recentServiceOrders.map((o) => ({ ...o, kind: 'service' as const })), ...data.recentPurchaseOrders.map((o) => ({ ...o, kind: 'client_po' as const }))]
      .filter((o) => !o.workOrderId)
      .slice(0, 4)
      .forEach((o) => {
        items.push(
          <ActionCard
            key={`order-${o.kind}-${o.id}`}
            icon="hammer"
            tone="completed"
            title="Ready for a work order"
            subtitle={[o.dealTitle, o.companyName].filter(Boolean).join(' · ')}
            actions={[
              { label: 'Create work order', primary: true, onPress: () => navigation.navigate('CreateWorkOrder', { kind: o.kind, orderId: o.id }) },
            ]}
            onPress={() => navigation.navigate('OrderDetail', { kind: o.kind, id: o.id })}
          />
        );
      });

    if (data.counts.grnsSubmitted > 0) {
      items.push(
        <ActionCard
          key="grn-submitted"
          icon="cube"
          tone="upcoming"
          title={`${data.counts.grnsSubmitted} GRN${data.counts.grnsSubmitted > 1 ? 's' : ''} waiting for approval`}
          subtitle="Approving adds the received materials to stock."
          actions={[{ label: 'Review', primary: true, onPress: () => navigation.navigate('Tabs', { screen: 'Stock', params: { segment: 'grn', status: 'submitted' } }) }]}
        />
      );
    }

    data.overdueTasks.slice(0, 5).forEach((t) => {
      items.push(
        <ActionCard
          key={`overdue-${t.taskId}`}
          icon="alert-circle"
          tone="overdue"
          title={`${t.typeOfWork ?? 'Task'} is ${dueInfo(t.endDate).label}`}
          subtitle={[t.workOrderTitle, t.assignedTo !== 'Unassigned' ? t.assignedTo : 'Unassigned'].join(' · ')}
          onPress={() => navigation.navigate('WorkOrderDetail', { id: t.workOrderId, openTaskId: t.taskId })}
        />
      );
    });

    return items;
    // handlers are recreated each render but only read current state; deps listed are the data inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, confirmingKey, navigation]);

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
      >
        <LinearGradient
          colors={['#0A1628', '#0F2A44', '#064E3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 12, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View className="flex-row items-center justify-between px-5">
            <View className="flex-1 pr-3">
              <Text className="text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {today}
              </Text>
              <Text className="text-2xl font-extrabold text-white mt-0.5" numberOfLines={1}>
                {greetingForNow()}, {firstName}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <IconButton icon="notifications-outline" label="Notifications" tone="light" badge={notes?.unreadCount} onPress={() => navigation.navigate('Notifications')} />
              <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Profile">
                <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={40} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}
          >
            {isLoading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="rounded-2xl" style={{ width: 132, height: 112, backgroundColor: 'rgba(255,255,255,0.12)' }} />)
              : kpis.map((k) => <KpiTile key={k.label} {...k} />)}
          </ScrollView>
        </LinearGradient>

        {isError ? (
          <EmptyState
            icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
            title="Couldn't load your dashboard"
            description="Check your connection and try again."
            action={<Button label="Retry" onPress={() => refetch()} />}
          />
        ) : (
          <>
            <View className="mt-6">
              <SectionHeader title="Needs you" count={needsYou.length || undefined} />
              <View className="px-5">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 rounded-2xl mb-3" />
                    <Skeleton className="h-24 rounded-2xl mb-3" />
                  </>
                ) : needsYou.length === 0 ? (
                  <View className="items-center py-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <Ionicons name="checkmark-done-circle" size={44} color="#10B981" />
                    <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mt-2">You're all caught up</Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Nothing needs your attention right now.</Text>
                  </View>
                ) : (
                  needsYou.map((el, i) => (
                    <Animated.View key={el.key} entering={FadeInDown.duration(300).delay(Math.min(i, 6) * 40)}>
                      {el}
                    </Animated.View>
                  ))
                )}
              </View>
            </View>

            <View className="mt-3">
              <SectionHeader title="Today" count={data?.todayWorkOrders.length || undefined} actionLabel="All work" onAction={() => navigation.navigate('Tabs', { screen: 'Work' })} />
              <View className="px-5">
                {!data || data.todayWorkOrders.length === 0 ? (
                  <View className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 items-center">
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">Nothing scheduled for today</Text>
                  </View>
                ) : (
                  <View className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 px-4 py-2">
                    {data.todayWorkOrders.map((t, i) => {
                      const meta =
                        (TASK_STATUS as Record<string, (typeof TASK_STATUS)[TaskStatus]>)[t.status] ??
                        (WORK_ORDER_STATUS as Record<string, (typeof WORK_ORDER_STATUS)[WorkOrderStatus]>)[t.status];
                      return (
                        <Pressable
                          key={t.workOrderId}
                          onPress={() => navigation.navigate('WorkOrderDetail', { id: t.workOrderId })}
                          className={`flex-row items-center py-3 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}`}
                          style={{ gap: 12 }}
                        >
                          <View className="items-center" style={{ width: 14 }}>
                            <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[15px] font-bold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
                              {t.workOrderTitle}
                            </Text>
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5" numberOfLines={1}>
                              {[t.typeOfWork, t.assignedTo].filter(Boolean).join(' · ')}
                            </Text>
                          </View>
                          {meta ? <StatusPill meta={meta} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {data && data.driverActivity.length > 0 ? (
              <View className="mt-6">
                <SectionHeader title="On the road" count={data.driverActivity.length} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                  {data.driverActivity.map((d) => (
                    <View
                      key={d.taskId}
                      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3.5"
                      style={{ width: 170 }}
                    >
                      <View className="flex-row items-center" style={{ gap: 10 }}>
                        <View
                          className="rounded-full items-center justify-center"
                          style={{
                            width: 42,
                            height: 42,
                            borderWidth: 2.5,
                            borderColor: d.status === 'in_progress' ? '#10B981' : '#CBD5E1',
                          }}
                        >
                          <Text className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200">{initials(d.driverName)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
                            {d.driverName}
                          </Text>
                          <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {d.status === 'in_progress' ? 'On a job' : 'Assigned'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-2.5" numberOfLines={2}>
                        {d.workOrderTitle}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <AssigneeSheet
        visible={!!assigning}
        onClose={() => setAssigning(null)}
        initialIds={[]}
        saving={assignTask.isPending}
        onSave={handleAssign}
      />
      <RescheduleSheet
        visible={!!rescheduling}
        requestedDate={rescheduling?.requestedPickupDate}
        loading={requestReschedule.isPending}
        onClose={() => setRescheduling(null)}
        onSubmit={handleReschedule}
      />
    </View>
  );
}
