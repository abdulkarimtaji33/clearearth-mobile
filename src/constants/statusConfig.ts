import type {
  InspectionPriority,
  InspectionRequestStatus,
  InspectionResponseStatus,
  PickupPriority,
  TaskStatus,
} from '@/api/types';

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

// Inspection tones are mapped onto the existing 4-tone palette (Badge/SummaryTiles)
// rather than adding new colors, so the inspection UI stays visually consistent
// with the driver app.
export const INSPECTION_PRIORITY_CONFIG: Record<InspectionPriority, { label: string; tone: PickupPriority }> = {
  critical: { label: 'Critical', tone: 'overdue' },
  high: { label: 'High', tone: 'today' },
  medium: { label: 'Medium', tone: 'upcoming' },
  low: { label: 'Low', tone: 'completed' },
};

export const INSPECTION_PRIORITY_ORDER: InspectionPriority[] = ['critical', 'high', 'medium', 'low'];

export const INSPECTION_STATUS_CONFIG: Record<InspectionRequestStatus, { label: string; tone: PickupPriority }> = {
  request_submitted: { label: 'New request', tone: 'upcoming' },
  team_assigned: { label: 'Team assigned', tone: 'today' },
  inspection_completed: { label: 'Inspected', tone: 'today' },
  report_submitted: { label: 'Report submitted', tone: 'completed' },
};

export const INSPECTION_STATUS_STEPS: { key: InspectionRequestStatus; label: string }[] = [
  { key: 'request_submitted', label: 'Requested' },
  { key: 'team_assigned', label: 'Assigned' },
  { key: 'inspection_completed', label: 'Inspected' },
  { key: 'report_submitted', label: 'Reported' },
];

export const INSPECTION_RESPONSE_CONFIG: Record<InspectionResponseStatus, { label: string; tone: PickupPriority }> = {
  pending: { label: 'Pending', tone: 'today' },
  accepted: { label: 'Accepted', tone: 'completed' },
  rejected: { label: 'Rejected', tone: 'overdue' },
};

export function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
