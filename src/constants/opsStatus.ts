import type { Ionicons } from '@expo/vector-icons';
import type { PickupPriority } from '@/theme/tokens';
import type {
  CertificateRequestStatus,
  GrnStatus,
  LeaveStatus,
  PickupDateStatus,
  TaskStatus,
  WorkOrderStatus,
} from '@/api/ops/types';

export type Tone = 'neutral' | PickupPriority;
type IconName = keyof typeof Ionicons.glyphMap;

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: IconName;
}

/** One map per entity so every screen renders a status identically. */
export const WORK_ORDER_STATUS: Record<WorkOrderStatus, StatusMeta> = {
  new: { label: 'New', tone: 'upcoming', icon: 'sparkles-outline' },
  in_progress: { label: 'In progress', tone: 'today', icon: 'play-circle-outline' },
  completed: { label: 'Completed', tone: 'completed', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'close-circle-outline' },
};

export const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  not_started: { label: 'Not started', tone: 'neutral', icon: 'ellipse-outline' },
  in_progress: { label: 'In progress', tone: 'today', icon: 'play-circle-outline' },
  completed: { label: 'Done', tone: 'completed', icon: 'checkmark-circle' },
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['not_started', 'in_progress', 'completed'];

export const GRN_STATUS: Record<GrnStatus, StatusMeta> = {
  new: { label: 'New', tone: 'upcoming', icon: 'document-outline' },
  submitted: { label: 'Submitted', tone: 'today', icon: 'paper-plane-outline' },
  approved: { label: 'Approved', tone: 'completed', icon: 'shield-checkmark-outline' },
};

export const PICKUP_DATE_STATUS: Record<PickupDateStatus, StatusMeta> = {
  pending: { label: 'Date to confirm', tone: 'today', icon: 'calendar-outline' },
  confirmed: { label: 'Date confirmed', tone: 'completed', icon: 'calendar-clear-outline' },
  reschedule_requested: { label: 'Reschedule requested', tone: 'overdue', icon: 'refresh-circle-outline' },
};

export const CERT_REQUEST_STATUS: Record<CertificateRequestStatus, StatusMeta> = {
  pending_verification: { label: 'Pending verification', tone: 'today', icon: 'time-outline' },
  verified: { label: 'Verified', tone: 'upcoming', icon: 'checkmark-outline' },
  generated: { label: 'Generated', tone: 'upcoming', icon: 'document-text-outline' },
  issued: { label: 'Issued', tone: 'completed', icon: 'ribbon-outline' },
};

export const LEAVE_STATUS: Record<LeaveStatus, StatusMeta> = {
  pending: { label: 'Pending', tone: 'today', icon: 'time-outline' },
  approved: { label: 'Approved', tone: 'completed', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', tone: 'overdue', icon: 'close-circle-outline' },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'ban-outline' },
};

export const TONE_HEX: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: '#64748B', bg: '#F1F5F9' },
  overdue: { fg: '#C23B3B', bg: '#FCEAEA' },
  today: { fg: '#C9791A', bg: '#FDF0DC' },
  upcoming: { fg: '#2571A0', bg: '#E4F1F8' },
  completed: { fg: '#059669', bg: '#ECFDF5' },
};

/** Work-order UX: the next sensible task status when the status chip is tapped. */
export function nextTaskStatus(current: TaskStatus): TaskStatus {
  if (current === 'not_started') return 'in_progress';
  if (current === 'in_progress') return 'completed';
  return 'not_started';
}
