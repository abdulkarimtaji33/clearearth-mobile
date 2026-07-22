import type { PickupPriority, TaskStatus } from '@/api/types';

export const PRIORITY_CONFIG: Record<PickupPriority, { label: string; tone: PickupPriority }> = {
  overdue: { label: 'Overdue', tone: 'overdue' },
  today: { label: 'Today', tone: 'today' },
  upcoming: { label: 'Upcoming', tone: 'upcoming' },
  completed: { label: 'Collected', tone: 'completed' },
};

export const PRIORITY_ORDER: PickupPriority[] = ['overdue', 'today', 'upcoming', 'completed'];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
