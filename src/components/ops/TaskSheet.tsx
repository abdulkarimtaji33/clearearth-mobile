import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { useToast } from '@/components/ui/Toast';
import { EvidenceSection } from '@/components/ops/EvidenceSection';
import { ExpensesSection } from '@/components/ops/ExpensesSection';
import { AssigneeSheet } from '@/components/ops/AssigneeSheet';
import { WorkTypePickerSheet } from '@/components/ops/WorkTypePickerSheet';
import { useEditTasks, useSetTaskAssignees, useSetTaskNotes, useSetTaskStatus } from '@/hooks/ops/useWorkOrders';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/opsStatus';
import { parseDateOnly, toDateOnly } from '@/lib/format';
import { formatQty } from '@/lib/opsFormat';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { TaskStatus, WorkOrderTask } from '@/api/ops/types';

interface TaskSheetProps {
  visible: boolean;
  onClose: () => void;
  workOrderId: number;
  tasks: WorkOrderTask[];
  task: WorkOrderTask | null;
  locked: boolean;
}

type Overlay = null | 'assign' | 'workType' | 'delete';

const peopleOf = (t: WorkOrderTask) =>
  t.assignees && t.assignees.length ? t.assignees : t.assignedUser ? [t.assignedUser] : [];

/**
 * Full task editor in a bottom sheet: status, assignees, work type, dates, notes, evidence and
 * expenses. Sub-pickers are rendered as sibling sheets (never nested modals) while this one hides.
 */
export function TaskSheet({ visible, onClose, workOrderId, tasks, task, locked }: TaskSheetProps) {
  const toast = useToast();
  const setStatus = useSetTaskStatus(workOrderId);
  const setNotes = useSetTaskNotes(workOrderId);
  const setAssignees = useSetTaskAssignees(workOrderId);
  const edit = useEditTasks(workOrderId, tasks);

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [notes, setNotesText] = useState('');

  useEffect(() => {
    setNotesText(task?.notes ?? '');
    // Re-seed when switching tasks, not on every server refresh (would clobber typing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  useEffect(() => {
    if (!visible) setOverlay(null);
  }, [visible]);

  if (!task) return null;
  const people = peopleOf(task);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn();
      if (ok) {
        haptic.success();
        toast.show(ok, 'success');
      }
      return true;
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
      return false;
    }
  }

  const changeStatus = (status: TaskStatus) => {
    if (status === task.status) return;
    run(() => setStatus.mutateAsync({ taskId: task.id, status }));
  };

  const saveNotes = () => {
    if ((task.notes ?? '') === notes.trim()) return;
    run(() => setNotes.mutateAsync({ taskId: task.id, notes: notes.trim() }));
  };

  const changeDate = (field: 'startDate' | 'endDate', d: Date | null) =>
    run(() => edit.editTask(task.id, { [field]: d ? toDateOnly(d) : null }));

  return (
    <>
      <BottomSheet
        visible={visible && overlay === null}
        onClose={onClose}
        title={task.type_of_work || 'Task'}
        subtitle={TASK_STATUS[task.status].label}
        tall
      >
        <View style={{ gap: 22 }} pointerEvents={locked ? 'none' : 'auto'}>
          <SegmentedControl
            options={TASK_STATUS_ORDER.map((s) => ({ key: s, label: TASK_STATUS[s].label }))}
            value={task.status}
            onChange={changeStatus}
          />

          {task.pickup_quantity != null && task.pickup_quantity !== '' || task.pickup_condition ? (
            <View className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800">
              <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                <Ionicons name="cube" size={17} color="#059669" />
                <Text className="text-base font-extrabold text-primary-800 dark:text-primary-200">Collected by driver</Text>
              </View>
              <View className="flex-row" style={{ gap: 24 }}>
                {task.pickup_quantity != null && task.pickup_quantity !== '' ? (
                  <View>
                    <Text className="text-xs text-neutral-500">Quantity</Text>
                    <Text className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">
                      {formatQty(task.pickup_quantity, task.pickup_uom)}
                    </Text>
                  </View>
                ) : null}
                {task.pickup_condition ? (
                  <View className="flex-1">
                    <Text className="text-xs text-neutral-500">Condition</Text>
                    <Text className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">{task.pickup_condition}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          <View>
            <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-2.5">Assigned to</Text>
            <Pressable
              onPress={() => setOverlay('assign')}
              accessibilityRole="button"
              className="flex-row items-center p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              style={{ gap: 10 }}
            >
              {people.length ? (
                <AvatarStack people={people} size={32} max={4} />
              ) : (
                <Ionicons name="person-add-outline" size={20} color="#94A3B8" />
              )}
              <Text className="flex-1 text-[15px] text-neutral-800 dark:text-neutral-100" numberOfLines={1}>
                {people.length
                  ? people.map((p) => `${p.first_name} ${p.last_name}`).join(', ')
                  : 'Unassigned. Tap to assign.'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">Details</Text>
            <Pressable
              onPress={() => setOverlay('workType')}
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-700 px-3.5 py-3.5 bg-white dark:bg-neutral-900"
            >
              <View>
                <Text className="text-xs text-neutral-500">Work type</Text>
                <Text className="text-base text-neutral-900 dark:text-neutral-50 mt-0.5">{task.type_of_work || 'Choose'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1">
                <DateTimeField
                  label="Start date"
                  value={parseDateOnly(task.start_date)}
                  onChange={(d) => changeDate('startDate', d)}
                  onClear={() => changeDate('startDate', null)}
                />
              </View>
              <View className="flex-1">
                <DateTimeField
                  label="Due date"
                  value={parseDateOnly(task.end_date)}
                  onChange={(d) => changeDate('endDate', d)}
                  onClear={() => changeDate('endDate', null)}
                />
              </View>
            </View>
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotesText}
              onBlur={saveNotes}
              placeholder="Add a note for the crew..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[72px]"
            />
          </View>

          <EvidenceSection workOrderId={workOrderId} taskId={task.id} files={task.files ?? []} />
          <ExpensesSection workOrderId={workOrderId} taskId={task.id} expenses={task.expenses ?? []} />

          <Button
            label="Delete task"
            variant="ghost"
            icon={<Ionicons name="trash-outline" size={18} color="#C23B3B" />}
            onPress={() => setOverlay('delete')}
          />
        </View>
        {locked ? (
          <Text className="text-xs text-neutral-500 text-center mt-4">
            Tasks are read-only because this work order is completed or cancelled.
          </Text>
        ) : null}
      </BottomSheet>

      <AssigneeSheet
        visible={visible && overlay === 'assign'}
        onClose={() => setOverlay(null)}
        initialIds={people.map((p) => p.id)}
        saving={setAssignees.isPending}
        onSave={async (ids) => {
          if (await run(() => setAssignees.mutateAsync({ taskId: task.id, assigneeIds: ids }), 'Assignment saved')) {
            setOverlay(null);
          }
        }}
      />

      <WorkTypePickerSheet
        visible={visible && overlay === 'workType'}
        selectedId={task.work_type_id}
        onClose={() => setOverlay(null)}
        onPick={async (id, name) => {
          if (await run(() => edit.editTask(task.id, { workTypeId: id, typeOfWork: name }), 'Work type updated')) {
            setOverlay(null);
          }
        }}
      />

      <ConfirmSheet
        visible={visible && overlay === 'delete'}
        destructive
        title="Delete this task?"
        message="Its evidence and expense lines go with it. Tasks that already have posted accounting expenses can't be deleted."
        confirmLabel="Delete task"
        loading={edit.isPending}
        onCancel={() => setOverlay(null)}
        onConfirm={async () => {
          if (await run(() => edit.deleteTask(task.id), 'Task deleted')) {
            setOverlay(null);
            onClose();
          }
        }}
      />
    </>
  );
}
