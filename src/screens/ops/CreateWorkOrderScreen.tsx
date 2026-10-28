import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrderDetail } from '@/hooks/ops/useOrders';
import { useCreateWorkOrder } from '@/hooks/ops/useWorkOrders';
import { useAssignees, useWorkTypes } from '@/hooks/ops/useLookups';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { InfoRow } from '@/components/ui/InfoRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AddTaskSheet } from '@/components/ops/AddTaskSheet';
import { dateRangeLabel, fullName, orderNumber, orderParty } from '@/lib/opsFormat';
import { formatFullDate } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { OrderRow, TaskInput } from '@/api/ops/types';
import type { OpsStackParamList } from '@/navigation/types';

const STEPS = ['Order', 'Tasks', 'Review'];

export function CreateWorkOrderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const { params } = useRoute<RouteProp<OpsStackParamList, 'CreateWorkOrder'>>();
  const toast = useToast();

  const { data: order, isLoading, isError, refetch } = useOrderDetail(params.kind, params.orderId);
  const { data: workTypes } = useWorkTypes();
  const { data: people } = useAssignees();
  const create = useCreateWorkOrder();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<TaskInput[]>([]);
  const [sheet, setSheet] = useState<null | { index: number | null }>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  const number = order ? orderNumber({ kind: params.kind, id: params.orderId, reference_number: order.reference_number }) : '';
  const defaultTitle = order ? `${order.deal?.title ?? 'Work order'} - ${number}` : '';
  const effectiveTitle = title ?? defaultTitle;
  const pickupDate = order?.confirmed_pickup_date ?? order?.requested_pickup_date ?? null;
  const party = order ? orderParty(order as OrderRow) : null;

  const nameOf = (ids?: number[]) =>
    (people ?? []).filter((p) => ids?.includes(p.id)).map(fullName).join(', ');

  const quickAdd = useMemo(
    () => (workTypes ?? []).filter((w) => w.is_active !== false),
    [workTypes]
  );

  function addTemplate(id: number, name: string) {
    haptic.tap();
    const isPickup = /pickup|collection/i.test(name);
    setTasks((t) => [
      ...t,
      {
        workTypeId: id,
        typeOfWork: name,
        startDate: isPickup ? pickupDate : null,
        endDate: isPickup ? pickupDate : null,
        status: 'not_started',
        assigneeIds: [],
      },
    ]);
  }

  const move = (i: number, dir: -1 | 1) =>
    setTasks((t) => {
      const j = i + dir;
      if (j < 0 || j >= t.length) return t;
      const next = [...t];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  function next() {
    if (step === 0 && !effectiveTitle.trim()) {
      setTitleError('Give the work order a title.');
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  async function submit() {
    try {
      const wo = await create.mutateAsync({
        ...(params.kind === 'service' ? { quotationId: params.orderId } : { purchaseOrderId: params.orderId }),
        title: effectiveTitle.trim(),
        notes: notes.trim() || undefined,
        tasks,
      });
      haptic.success();
      toast.show('Work order created', 'success');
      navigation.replace('WorkOrderDetail', { id: wo.id });
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
        <ScreenHeader title="New work order" back />
        <View className="p-5" style={{ gap: 12 }}>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </View>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
        <ScreenHeader title="New work order" back />
        <EmptyState title="Couldn't load the order" action={<Button label="Retry" onPress={() => refetch()} />} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-neutral-50 dark:bg-neutral-950" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="New work order" subtitle={number} back />
      <StepIndicator steps={STEPS} current={step} />

      <KeyboardAwareScrollView
        inset={Platform.OS !== 'ios'}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <View style={{ gap: 16 }}>
            <Card>
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-1">From this order</Text>
              <InfoRow icon="document-text-outline" label="Order" value={number} />
              <InfoRow icon="briefcase-outline" label="Deal" value={order.deal?.title} />
              <InfoRow icon="business-outline" label="Party" value={party} />
              <InfoRow icon="calendar-outline" label="Pickup date" value={pickupDate ? formatFullDate(pickupDate) : null} />
            </Card>
            <Input
              label="Work order title"
              value={effectiveTitle}
              onChangeText={(t) => {
                setTitle(t);
                setTitleError(null);
              }}
              error={titleError ?? undefined}
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything the crew should know..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[96px]"
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 leading-5">
              Tap a work type to add it as a task, or build one with dates and people.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
              {quickAdd.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => addTemplate(w.id, w.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${w.name} task`}
                  className="flex-row items-center px-3.5 py-2.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800"
                  style={{ gap: 5 }}
                >
                  <Ionicons name="add" size={16} color="#059669" />
                  <Text className="text-sm font-bold text-primary-700 dark:text-primary-300">{w.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {tasks.length === 0 ? (
              <View className="items-center py-10 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                <Ionicons name="list-outline" size={34} color="#94A3B8" />
                <Text className="text-sm text-neutral-500 mt-2">No tasks yet. You can also add them later.</Text>
              </View>
            ) : (
              tasks.map((t, i) => (
                <Card key={i} className="mb-2.5">
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <View className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
                      <Text className="text-sm font-extrabold text-neutral-600 dark:text-neutral-300">{i + 1}</Text>
                    </View>
                    <Pressable className="flex-1" onPress={() => setSheet({ index: i })} accessibilityRole="button">
                      <Text className="text-[15px] font-extrabold text-neutral-900 dark:text-neutral-50">{t.typeOfWork}</Text>
                      <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>
                        {[dateRangeLabel(t.startDate, t.endDate), nameOf(t.assigneeIds) || 'Unassigned'].filter(Boolean).join(' · ')}
                      </Text>
                    </Pressable>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Pressable onPress={() => move(i, -1)} hitSlop={8} disabled={i === 0} accessibilityLabel="Move up" className={i === 0 ? 'opacity-30' : ''}>
                        <Ionicons name="chevron-up" size={20} color="#64748B" />
                      </Pressable>
                      <Pressable onPress={() => move(i, 1)} hitSlop={8} disabled={i === tasks.length - 1} accessibilityLabel="Move down" className={i === tasks.length - 1 ? 'opacity-30' : ''}>
                        <Ionicons name="chevron-down" size={20} color="#64748B" />
                      </Pressable>
                      <Pressable onPress={() => setTasks((all) => all.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove task" className="ml-1.5">
                        <Ionicons name="trash-outline" size={19} color="#C23B3B" />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))
            )}

            <Button
              label="Add custom task"
              variant="secondary"
              icon={<Ionicons name="add-circle-outline" size={19} color="#059669" />}
              onPress={() => setSheet({ index: null })}
              fullWidth
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 16 }}>
            <Card>
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-1">{effectiveTitle}</Text>
              <Text className="text-xs text-neutral-500 mb-2">From {number}{party ? ` · ${party}` : ''}</Text>
              {notes.trim() ? <Text className="text-sm text-neutral-700 dark:text-neutral-200 leading-5">{notes.trim()}</Text> : null}
            </Card>
            <Card>
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-2">
                {tasks.length} task{tasks.length === 1 ? '' : 's'}
              </Text>
              {tasks.length === 0 ? (
                <Text className="text-sm text-neutral-500">No tasks. You can add them after creating.</Text>
              ) : (
                tasks.map((t, i) => (
                  <View key={i} className={`flex-row items-center py-2.5 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}`} style={{ gap: 10 }}>
                    <Text className="text-sm font-extrabold text-neutral-400 w-5">{i + 1}</Text>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-neutral-900 dark:text-neutral-50">{t.typeOfWork}</Text>
                      <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>
                        {[dateRangeLabel(t.startDate, t.endDate), nameOf(t.assigneeIds) || 'Unassigned'].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <View
        className="flex-row px-5 pt-3 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
        style={{ paddingBottom: Math.max(insets.bottom, 14), gap: 10 }}
      >
        {step > 0 ? (
          <View style={{ width: 110 }}>
            <Button label="Back" variant="secondary" size="lg" onPress={() => setStep((s) => s - 1)} fullWidth />
          </View>
        ) : null}
        <View className="flex-1">
          {step < 2 ? (
            <Button label="Continue" size="lg" onPress={next} fullWidth />
          ) : (
            <Button label="Create work order" size="lg" loading={create.isPending} onPress={submit} fullWidth />
          )}
        </View>
      </View>

      <AddTaskSheet
        visible={sheet !== null}
        title={sheet?.index === null ? 'Add task' : 'Edit task'}
        submitLabel={sheet?.index === null ? 'Add task' : 'Save task'}
        initial={sheet && sheet.index !== null ? tasks[sheet.index] : null}
        onClose={() => setSheet(null)}
        onSubmit={(input) => {
          setTasks((all) =>
            sheet && sheet.index !== null ? all.map((t, i) => (i === sheet.index ? input : t)) : [...all, input]
          );
          setSheet(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
