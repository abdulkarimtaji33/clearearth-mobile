import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLeaveDecision, useLeaveRequests } from '@/hooks/ops/useMore';
import { usePermission } from '@/hooks/usePermission';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { LEAVE_STATUS } from '@/constants/opsStatus';
import { dateRangeLabel, fullName } from '@/lib/opsFormat';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { LeaveRequestRow } from '@/api/ops/types';

type Tab = 'pending' | 'history';

export function LeaveScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can } = usePermission();
  const allowed = can('hr.leave.approve');
  const [tab, setTab] = useState<Tab>('pending');
  const [rejecting, setRejecting] = useState<LeaveRequestRow | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useLeaveRequests(undefined, allowed);
  const decide = useLeaveDecision();

  const rows = (data ?? []).filter((r) => (tab === 'pending' ? r.status === 'pending' : r.status !== 'pending'));
  const pendingCount = (data ?? []).filter((r) => r.status === 'pending').length;

  async function approve(r: LeaveRequestRow) {
    setBusyId(r.id);
    try {
      await decide.mutateAsync({ id: r.id });
      haptic.success();
      toast.show('Leave approved', 'success');
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function reject() {
    if (!rejecting) return;
    try {
      await decide.mutateAsync({ id: rejecting.id, reject: true, reason: reason.trim() });
      haptic.success();
      toast.show('Leave rejected', 'success');
      setRejecting(null);
      setReason('');
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  if (!allowed) {
    return (
      <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
        <ScreenHeader title="Team leave" back />
        <EmptyState icon={<Ionicons name="lock-closed-outline" size={40} color="#94A3B8" />} title="No access to leave approvals" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="Team leave" subtitle="Your direct reports" back />
      <View className="px-5 pt-3 pb-3">
        <SegmentedControl<Tab>
          options={[
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'history', label: 'History' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {isLoading ? (
        <View className="px-5" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </View>
      ) : isError ? (
        <EmptyState title="Couldn't load leave requests" action={<Button label="Retry" onPress={() => refetch()} />} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name={tab === 'pending' ? 'checkmark-done-outline' : 'time-outline'} size={40} color="#94A3B8" />}
              title={tab === 'pending' ? 'No pending requests' : 'No history yet'}
              description={tab === 'pending' ? "You're all caught up." : undefined}
            />
          }
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3">
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <Avatar name={fullName(item.employee)} size={42} />
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">{fullName(item.employee) || 'Employee'}</Text>
                  <Text className="text-xs text-neutral-500 mt-0.5">
                    {item.leaveType?.name ?? 'Leave'} · {dateRangeLabel(item.start_date, item.end_date)}
                    {item.days_count ? ` · ${Number(item.days_count)} day${Number(item.days_count) === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
                <StatusPill meta={LEAVE_STATUS[item.status]} />
              </View>
              {item.reason ? <Text className="text-sm text-neutral-600 dark:text-neutral-300 mt-3 leading-5">{item.reason}</Text> : null}
              {item.status === 'pending' ? (
                <View className="flex-row mt-3.5" style={{ gap: 10 }}>
                  <View className="flex-1">
                    <Button label="Reject" variant="secondary" onPress={() => { setReason(''); setRejecting(item); }} fullWidth />
                  </View>
                  <View className="flex-1">
                    <Button label="Approve" loading={busyId === item.id} onPress={() => approve(item)} fullWidth />
                  </View>
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      <BottomSheet
        visible={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Reject leave request"
        subtitle={rejecting ? fullName(rejecting.employee) : undefined}
        footer={<Button label="Reject request" variant="destructive" loading={decide.isPending} onPress={reject} fullWidth size="lg" disabled={!reason.trim()} />}
      >
        <Input label="Reason (shared with the employee)" value={reason} onChangeText={setReason} multiline numberOfLines={3} textAlignVertical="top" className="min-h-[72px]" autoFocus />
      </BottomSheet>
    </View>
  );
}
