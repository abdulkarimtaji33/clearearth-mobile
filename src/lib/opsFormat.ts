import { formatShortDate, todayDateOnly } from '@/lib/format';
import type { OrderRow, PurchaseOrderRow, WorkOrderTask } from '@/api/ops/types';

const DAY_MS = 86_400_000;

/** Whole days from today to a DATEONLY string (negative = past). */
export function daysFromToday(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr.slice(0, 10)}T12:00:00`).getTime();
  const today = new Date(`${todayDateOnly()}T12:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.round((target - today) / DAY_MS);
}

export interface DueInfo {
  label: string;
  tone: 'overdue' | 'today' | 'upcoming' | 'neutral';
}

/** "3d overdue" / "Due today" / "Due tomorrow" / "Due Oct 22". */
export function dueInfo(dateStr?: string | null, done = false): DueInfo {
  if (!dateStr) return { label: 'No due date', tone: 'neutral' };
  if (done) return { label: formatShortDate(dateStr) ?? '', tone: 'neutral' };
  const d = daysFromToday(dateStr);
  if (d === null) return { label: 'No due date', tone: 'neutral' };
  if (d < 0) return { label: `${-d}d overdue`, tone: 'overdue' };
  if (d === 0) return { label: 'Due today', tone: 'today' };
  if (d === 1) return { label: 'Due tomorrow', tone: 'upcoming' };
  return { label: `Due ${formatShortDate(dateStr)}`, tone: 'upcoming' };
}

export function dateRangeLabel(start?: string | null, end?: string | null): string | null {
  const s = formatShortDate(start);
  const e = formatShortDate(end);
  if (s && e) return s === e ? s : `${s} to ${e}`;
  return s ?? e ?? null;
}

export function fullName(p?: { first_name?: string | null; last_name?: string | null } | null): string {
  return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : '';
}

/** Counterparty name for an order row (client for service/client PO, vendor for vendor PO). */
export function orderParty(order: OrderRow): string | null {
  if (order.kind === 'service') return null;
  const po = order as PurchaseOrderRow;
  return po.company?.company_name ?? po.supplier?.company_name ?? null;
}

export function orderNumber(order: { kind: string; id: number; reference_number?: number | null }): string {
  const prefix = order.kind === 'service' ? 'SO' : order.kind === 'client_po' ? 'CPO' : 'VPO';
  return `${prefix}-${order.reference_number ?? order.id}`;
}

export function orderWorkOrder(order: OrderRow) {
  return order.kind === 'service' ? order.workOrder : (order as PurchaseOrderRow).sourceWorkOrder;
}

export function formatQty(q: number | string | null | undefined, uom?: string | null): string {
  if (q === null || q === undefined || q === '') return '-';
  const n = Number(q);
  const text = Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(q);
  return uom ? `${text} ${uom}` : text;
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "120 kg · Good" from the details a driver enters when marking a pickup collected; null if none. */
export function collectedSummary(task: Pick<WorkOrderTask, 'pickup_quantity' | 'pickup_uom' | 'pickup_condition'>): string | null {
  const hasQty = task.pickup_quantity !== null && task.pickup_quantity !== undefined && task.pickup_quantity !== '';
  const parts = [hasQty ? formatQty(task.pickup_quantity, task.pickup_uom) : null, task.pickup_condition || null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
