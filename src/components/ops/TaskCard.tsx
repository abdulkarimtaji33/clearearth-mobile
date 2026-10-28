import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPill } from '@/components/ui/StatusPill';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { TASK_STATUS, TONE_HEX, nextTaskStatus } from '@/constants/opsStatus';
import { collectedSummary, dateRangeLabel, dueInfo } from '@/lib/opsFormat';
import { haptic } from '@/lib/haptics';
import type { TaskStatus, WorkOrderTask } from '@/api/ops/types';

interface TaskCardProps {
  task: WorkOrderTask;
  index: number;
  readOnly: boolean;
  onOpen: (task: WorkOrderTask) => void;
  onCycleStatus: (task: WorkOrderTask, next: TaskStatus) => void;
}

export const TaskCard = React.memo(function TaskCard({ task, index, readOnly, onOpen, onCycleStatus }: TaskCardProps) {
  const done = task.status === 'completed';
  const due = dueInfo(task.end_date, done);
  const people = task.assignees?.length ? task.assignees : task.assignedUser ? [task.assignedUser] : [];
  const fileCount = task.files?.length ?? 0;
  const expenseCount = task.expenses?.length ?? 0;
  const range = dateRangeLabel(task.start_date, task.end_date);
  const collected = collectedSummary(task);

  return (
    <Pressable
      onPress={() => onOpen(task)}
      accessibilityRole="button"
      accessibilityLabel={`Task ${index + 1}: ${task.type_of_work ?? 'Task'}, ${TASK_STATUS[task.status].label}`}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-2.5 active:opacity-90"
    >
      <View className="flex-row items-start" style={{ gap: 12 }}>
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${done ? 'bg-primary-600' : 'bg-neutral-100 dark:bg-neutral-800'}`}
        >
          {done ? (
            <Ionicons name="checkmark" size={18} color="#fff" />
          ) : (
            <Text className="text-sm font-extrabold text-neutral-600 dark:text-neutral-300">{index + 1}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text
            className={`text-[15px] font-extrabold ${done ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-neutral-50'}`}
            numberOfLines={1}
          >
            {task.type_of_work || 'Task'}
          </Text>
          <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
            {range ? <Text className="text-xs text-neutral-500">{range}</Text> : <Text className="text-xs text-neutral-400">No dates</Text>}
            {!done && task.end_date && due.tone === 'overdue' ? (
              <Text className="text-xs font-bold" style={{ color: TONE_HEX.overdue.fg }}>
                · {due.label}
              </Text>
            ) : null}
          </View>
        </View>
        <StatusPill
          meta={TASK_STATUS[task.status]}
          onPress={
            readOnly
              ? undefined
              : () => {
                  haptic.light();
                  onCycleStatus(task, nextTaskStatus(task.status));
                }
          }
        />
      </View>

      {collected ? (
        <View className="flex-row items-center mt-3 px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/30" style={{ gap: 8 }}>
          <Ionicons name="cube" size={15} color="#059669" />
          <Text className="flex-1 text-[13px] font-bold text-primary-800 dark:text-primary-200" numberOfLines={1}>
            Collected: {collected}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between mt-3">
        {people.length ? (
          <AvatarStack people={people} size={24} max={4} />
        ) : (
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Ionicons name="person-add-outline" size={14} color="#94A3B8" />
            <Text className="text-xs text-neutral-400">Unassigned</Text>
          </View>
        )}
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {task.notes ? <Ionicons name="chatbox-ellipses-outline" size={15} color="#94A3B8" /> : null}
          {fileCount > 0 ? (
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Ionicons name="images-outline" size={15} color="#94A3B8" />
              <Text className="text-xs text-neutral-500">{fileCount}</Text>
            </View>
          ) : null}
          {expenseCount > 0 ? (
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Ionicons name="receipt-outline" size={15} color="#94A3B8" />
              <Text className="text-xs text-neutral-500">{expenseCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
