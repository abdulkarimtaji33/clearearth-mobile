export function formatShortDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

/** For full ISO datetimes (e.g. inspection_datetime), unlike formatShortDate/
 * formatFullDate which expect a DATEONLY string and pin it to noon. */
export function formatDateTime(isoStr: string | null | undefined): string | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMoney(value: number | string | null | undefined, currency?: string | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return null;
  const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return currency ? `${currency} ${formatted}` : formatted;
}
