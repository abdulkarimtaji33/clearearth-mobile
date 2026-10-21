import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { Input } from '@/components/ui/Input';
import { WorkTypePickerSheet } from '@/components/ops/WorkTypePickerSheet';
import { AssigneeSheet } from '@/components/ops/AssigneeSheet';
import { useAssignees } from '@/hooks/ops/useLookups';
import { toDateOnly } from '@/lib/format';
import { fullName } from '@/lib/opsFormat';
import type { TaskInput } from '@/api/ops/types';

interface AddTaskSheetProps {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: TaskInput) => void;
}

/** Quick "add a task" form: work type, optional dates, optional assignees, optional note. */
export function AddTaskSheet({ visible, saving = false, onClose, onSubmit }: AddTaskSheetProps) {
  const { data: people } = useAssignees();
  const [workType, setWorkType] = useState<{ id: number; name: string } | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [overlay, setOverlay] = useState<null | 'type' | 'assign'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setWorkType(null);
      setStart(null);
      setEnd(null);
      setAssigneeIds([]);
      setNotes('');
      setOverlay(null);
      setError(null);
    }
  }, [visible]);

  const assigneeNames = (people ?? []).filter((p) => assigneeIds.includes(p.id)).map(fullName).join(', ');

  function submit() {
    if (!workType) {
      setError('Choose a work type.');
      return;
    }
    onSubmit({
      workTypeId: workType.id,
      typeOfWork: workType.name,
      startDate: start ? toDateOnly(start) : null,
      endDate: end ? toDateOnly(end) : null,
      assigneeIds,
      notes: notes.trim() || null,
      status: 'not_started',
    });
  }

  return (
    <>
      <BottomSheet
        visible={visible && overlay === null}
        onClose={onClose}
        title="Add task"
        footer={<Button label="Add task" loading={saving} onPress={submit} fullWidth size="lg" />}
      >
        <View style={{ gap: 14 }}>
          <View>
            <Pressable
              onPress={() => setOverlay('type')}
              accessibilityRole="button"
              className={`flex-row items-center justify-between rounded-md border px-3.5 py-3.5 bg-white dark:bg-neutral-900 ${
                error ? 'border-danger-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <View>
                <Text className="text-xs text-neutral-500">Work type</Text>
                <Text className={`text-base mt-0.5 ${workType ? 'text-neutral-900 dark:text-neutral-50' : 'text-neutral-400'}`}>
                  {workType?.name ?? 'Choose a work type'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
            {error ? <Text className="text-xs text-danger-500 mt-1.5">{error}</Text> : null}
          </View>
          <View className="flex-row" style={{ gap: 10 }}>
            <View className="flex-1">
              <DateTimeField label="Start date" value={start} onChange={setStart} onClear={() => setStart(null)} />
            </View>
            <View className="flex-1">
              <DateTimeField label="Due date" value={end} onChange={setEnd} onClear={() => setEnd(null)} />
            </View>
          </View>
          <Pressable
            onPress={() => setOverlay('assign')}
            accessibilityRole="button"
            className="flex-row items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-700 px-3.5 py-3.5 bg-white dark:bg-neutral-900"
          >
            <View className="flex-1 pr-2">
              <Text className="text-xs text-neutral-500">Assigned to</Text>
              <Text className={`text-base mt-0.5 ${assigneeNames ? 'text-neutral-900 dark:text-neutral-50' : 'text-neutral-400'}`} numberOfLines={1}>
                {assigneeNames || 'Unassigned'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
          <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" className="min-h-[72px]" />
        </View>
      </BottomSheet>

      <WorkTypePickerSheet
        visible={visible && overlay === 'type'}
        selectedId={workType?.id ?? null}
        onClose={() => setOverlay(null)}
        onPick={(id, name) => {
          setWorkType({ id, name });
          setError(null);
          setOverlay(null);
        }}
      />
      <AssigneeSheet
        visible={visible && overlay === 'assign'}
        onClose={() => setOverlay(null)}
        initialIds={assigneeIds}
        onSave={(ids) => {
          setAssigneeIds(ids);
          setOverlay(null);
        }}
      />
    </>
  );
}
