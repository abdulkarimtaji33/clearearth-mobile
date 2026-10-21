import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkOrder, useEditTasks, useSetTaskStatus, useUpdateWorkOrder, useDeleteWorkOrder } from '@/hooks/ops/useWorkOrders';
import { useGrnForWorkOrder } from '@/hooks/ops/useGrn';
import { usePermission } from '@/hooks/usePermission';
import { ScreenHeader, IconButton } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { InfoRow } from '@/components/ui/InfoRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { TaskCard } from '@/components/ops/TaskCard';
import { TaskSheet } from '@/components/ops/TaskSheet';
import { AddTaskSheet } from '@/components/ops/AddTaskSheet';
import { EditWorkOrderSheet } from '@/components/ops/EditWorkOrderSheet';
import { GRN_STATUS, WORK_ORDER_STATUS } from '@/constants/opsStatus';
import { callPhoneNumber, openPickupLocation } from '@/lib/linking';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { fullName } from '@/lib/opsFormat';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { TaskStatus, WorkOrderStatus, WorkOrderTask } from '@/api/ops/types';
import type { OpsStackParamList } from '@/navigation/types';

type Confirm = null | 'complete' | 'reopen' | 'cancel' | 'delete' | 'start';

export function WorkOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const { params } = useRoute<RouteProp<OpsStackParamList, 'WorkOrderDetail'>>();
  const toast = useToast();
  const { can } = usePermission();
  const canEdit = can('operations.update');

  const { data: wo, isLoading, isError, refetch, isRefetching } = useWorkOrder(params.id);
  useRefreshOnFocus(refetch);
  const { data: grn } = useGrnForWorkOrder(params.id, wo?.status === 'completed');
  const setTaskStatus = useSetTaskStatus(params.id);
  const update = useUpdateWorkOrder(params.id);
  const del = useDeleteWorkOrder();
  const editTasks = useEditTasks(params.id, wo?.tasks);

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const opened = useRef(false);

  // Deep link from Home / notifications: open a specific task once the data is here.
  useEffect(() => {
    if (params.openTaskId && wo && !opened.current) {
      opened.current = true;
      setActiveTaskId(params.openTaskId);
    }
  }, [params.openTaskId, wo]);

  const tasks = wo?.tasks ?? [];
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
  const open = tasks.filter((t) => t.status !== 'completed').length;
  const closed = wo?.status === 'completed' || wo?.status === 'cancelled';
  const progress = tasks.length ? (tasks.length - open) / tasks.length : 0;

  const requirements = useMemo(() => {
    const d = wo?.deal;
    if (!d) return [];
    return [
      d.wds_required && 'Waste data sheet',
      d.certificate_required && 'Certificate',
      d.inspection_required && 'Inspection',
      d.custom_inspection && 'Customs inspection',
      d.trakhees_inspection && 'Trakhees',
      d.dubai_municipality_inspection && 'Dubai Municipality',
    ].filter(Boolean) as string[];
  }, [wo?.deal]);

  async function changeWoStatus(status: WorkOrderStatus, ok: string) {
    try {
      await update.mutateAsync({ status });
      haptic.success();
      toast.show(ok, 'success');
      setConfirm(null);
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  async function handleDelete() {
    try {
      await del.mutateAsync(params.id);
      haptic.success();
      toast.show('Work order deleted', 'success');
      setConfirm(null);
      navigation.goBack();
    } catch (err) {
      toast.show(toUserMessage(err), 'error');
    }
  }

  function cycleStatus(task: WorkOrderTask, next: TaskStatus) {
    setTaskStatus.mutate(
      { taskId: task.id, status: next },
      { onError: (err) => toast.show(toUserMessage(err), 'error') }
    );
  }

  const party = wo?.deal?.company?.company_name ?? wo?.deal?.supplier?.company_name ?? null;

  const primary = !wo || !canEdit
    ? null
    : wo.status === 'new'
      ? { label: 'Start work order', icon: 'play' as const, onPress: () => setConfirm('start'), disabled: false }
      : wo.status === 'in_progress'
        ? { label: open > 0 ? `Complete (${open} task${open > 1 ? 's' : ''} open)` : 'Complete work order', icon: 'checkmark-done' as const, onPress: () => setConfirm('complete'), disabled: open > 0 }
        : { label: 'Reopen work order', icon: 'refresh' as const, onPress: () => setConfirm('reopen'), disabled: false };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader
        title={wo?.title || (isLoading ? 'Loading...' : `Work order #${params.id}`)}
        subtitle={wo?.deal?.deal_number ? `Deal ${wo.deal.deal_number}` : undefined}
        back
        right={canEdit && wo ? <IconButton icon="ellipsis-horizontal" label="More actions" onPress={() => setMenu(true)} /> : null}
      />

      {isLoading ? (
        <View className="p-5" style={{ gap: 12 }}>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </View>
      ) : isError || !wo ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this work order"
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (primary ? 110 : 32) }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
          >
            <Card className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <StatusPill meta={WORK_ORDER_STATUS[wo.status]} size="md" />
                <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                  {tasks.length - open}/{tasks.length} tasks done
                </Text>
              </View>
              <ProgressBar value={progress} height={8} />
              {wo.taskSummary.overdue > 0 ? (
                <View className="mt-3">
                  <StatusPill label={`${wo.taskSummary.overdue} overdue task${wo.taskSummary.overdue > 1 ? 's' : ''}`} tone="overdue" icon="alert-circle-outline" />
                </View>
              ) : null}
            </Card>

            <Card className="mb-5">
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-1">Job details</Text>
              <InfoRow icon="business-outline" label={wo.deal?.supplier ? 'Vendor' : 'Client'} value={party} />
              <InfoRow
                icon="person-outline"
                label="Contact"
                value={wo.deal?.contact ? `${fullName(wo.deal.contact)}${wo.deal.contact.phone ? ` · ${wo.deal.contact.phone}` : ''}` : null}
                onPress={wo.deal?.contact?.phone ? () => callPhoneNumber(wo.deal!.contact!.phone!) : undefined}
                actionIcon="call-outline"
              />
              <InfoRow
                icon="location-outline"
                label="Pickup location"
                value={wo.deal?.pickup_location}
                onPress={wo.deal?.pickup_location ? () => openPickupLocation(wo.deal!.pickup_location!) : undefined}
                actionIcon="navigate-outline"
              />
              <InfoRow
                icon="call-outline"
                label={wo.deal?.pickup_contact_name ? `Site contact · ${wo.deal.pickup_contact_name}` : 'Site contact'}
                value={wo.deal?.pickup_contact_number}
                onPress={wo.deal?.pickup_contact_number ? () => callPhoneNumber(wo.deal!.pickup_contact_number!) : undefined}
                actionIcon="call-outline"
              />
              <InfoRow icon="cube-outline" label="Container" value={wo.deal?.container_type} />
              {requirements.length > 0 ? (
                <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
                  {requirements.map((r) => (
                    <StatusPill key={r} label={r} tone="upcoming" icon="shield-checkmark-outline" />
                  ))}
                </View>
              ) : null}
              {wo.notes ? (
                <View className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <Text className="text-xs text-neutral-500 mb-0.5">Notes</Text>
                  <Text className="text-sm text-neutral-800 dark:text-neutral-100 leading-5">{wo.notes}</Text>
                </View>
              ) : null}
            </Card>

            <SectionHeader
              title="Tasks"
              count={tasks.length}
              padded={false}
              actionLabel={canEdit && !closed ? 'Add task' : undefined}
              onAction={() => setAdding(true)}
            />
            {tasks.length === 0 ? (
              <EmptyState
                icon={<Ionicons name="list-outline" size={36} color="#94A3B8" />}
                title="No tasks yet"
                description="Add the steps for this job: pickup, transport, destruction..."
                action={canEdit && !closed ? <Button label="Add task" onPress={() => setAdding(true)} /> : undefined}
              />
            ) : (
              tasks.map((t, i) => (
                <TaskCard key={t.id} task={t} index={i} readOnly={closed || !canEdit} onOpen={(task) => setActiveTaskId(task.id)} onCycleStatus={cycleStatus} />
              ))
            )}

            {(grn || (wo.purchaseBills && wo.purchaseBills.length > 0)) ? (
              <View className="mt-4">
                <SectionHeader title="Documents" padded={false} />
                {grn ? (
                  <Card className="mb-2.5">
                    <InfoRow
                      icon="cube-outline"
                      label="Goods received note"
                      value={`${grn.grn_number} · ${GRN_STATUS[grn.status].label}`}
                      onPress={() => navigation.navigate('GrnDetail', { id: grn.id })}
                    />
                  </Card>
                ) : null}
                {(wo.purchaseBills ?? []).map((b) => (
                  <Card key={b.id} className="mb-2.5">
                    <InfoRow
                      icon="receipt-outline"
                      label={b.supplier ? 'Vendor bill' : 'Client bill'}
                      value={`${b.supplier?.company_name ?? b.company?.company_name ?? 'Bill'} · ${b.status}`}
                    />
                  </Card>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {primary ? (
            <View
              className="absolute left-0 right-0 bottom-0 px-5 pt-3 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-100 dark:border-neutral-800"
              style={{ paddingBottom: Math.max(insets.bottom, 14) }}
            >
              <Button
                label={primary.label}
                size="lg"
                fullWidth
                disabled={primary.disabled}
                variant={wo.status === 'completed' || wo.status === 'cancelled' ? 'secondary' : 'primary'}
                icon={<Ionicons name={primary.icon} size={20} color={wo.status === 'completed' || wo.status === 'cancelled' ? '#059669' : '#fff'} />}
                onPress={primary.onPress}
              />
              {primary.disabled ? (
                <Text className="text-xs text-neutral-500 text-center mt-2">Finish every task to complete this work order.</Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <TaskSheet
        visible={activeTaskId !== null && !!activeTask}
        onClose={() => setActiveTaskId(null)}
        workOrderId={params.id}
        tasks={tasks}
        task={activeTask}
        locked={closed || !canEdit}
      />

      <AddTaskSheet
        visible={adding}
        saving={editTasks.isPending}
        onClose={() => setAdding(false)}
        onSubmit={async (input) => {
          try {
            await editTasks.addTask(input);
            haptic.success();
            toast.show('Task added', 'success');
            setAdding(false);
          } catch (err) {
            toast.show(toUserMessage(err), 'error');
          }
        }}
      />

      <EditWorkOrderSheet
        visible={editing}
        title={wo?.title ?? null}
        notes={wo?.notes ?? null}
        saving={update.isPending}
        onClose={() => setEditing(false)}
        onSave={async (v) => {
          try {
            await update.mutateAsync({ title: v.title, notes: v.notes });
            haptic.success();
            toast.show('Work order updated', 'success');
            setEditing(false);
          } catch (err) {
            toast.show(toUserMessage(err), 'error');
          }
        }}
      />

      <BottomSheet visible={menu} onClose={() => setMenu(false)} title="Work order actions">
        <View style={{ gap: 4 }}>
          <MenuRow icon="create-outline" label="Edit title and notes" onPress={() => { setMenu(false); setEditing(true); }} />
          {wo && wo.status !== 'completed' && wo.status !== 'cancelled' ? (
            <MenuRow icon="close-circle-outline" label="Cancel work order" onPress={() => { setMenu(false); setConfirm('cancel'); }} />
          ) : null}
          <MenuRow icon="trash-outline" label="Delete work order" destructive onPress={() => { setMenu(false); setConfirm('delete'); }} />
        </View>
      </BottomSheet>

      <ConfirmSheet
        visible={confirm === 'start'}
        title="Start this work order?"
        message="It will be marked in progress and visible to the assigned crew."
        confirmLabel="Start"
        loading={update.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => changeWoStatus('in_progress', 'Work order started')}
      />
      <ConfirmSheet
        visible={confirm === 'complete'}
        title="Complete this work order?"
        message="All tasks are done. A GRN (goods received note) and the purchase bill will be created automatically."
        confirmLabel="Complete work order"
        loading={update.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => changeWoStatus('completed', 'Completed. GRN and purchase bill created.')}
      />
      <ConfirmSheet
        visible={confirm === 'reopen'}
        title="Reopen this work order?"
        message="It goes back to in progress so tasks can be edited again."
        confirmLabel="Reopen"
        loading={update.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => changeWoStatus(wo?.status === 'cancelled' ? 'new' : 'in_progress', 'Work order reopened')}
      />
      <ConfirmSheet
        visible={confirm === 'cancel'}
        destructive
        title="Cancel this work order?"
        message="Crews will no longer see it. You can reopen it later."
        confirmLabel="Cancel work order"
        cancelLabel="Keep it"
        loading={update.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => changeWoStatus('cancelled', 'Work order cancelled')}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        destructive
        title="Delete this work order?"
        message="This permanently removes it and all of its tasks. This can't be undone."
        confirmLabel="Delete permanently"
        loading={del.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

function MenuRow({ icon, label, onPress, destructive = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <View>
      <Button
        label={label}
        variant={destructive ? 'destructive' : 'secondary'}
        icon={<Ionicons name={icon} size={19} color={destructive ? '#fff' : '#059669'} />}
        onPress={onPress}
        fullWidth
      />
      <View style={{ height: 8 }} />
    </View>
  );
}
