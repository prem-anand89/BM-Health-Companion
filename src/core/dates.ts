import { format, subDays, startOfDay, parseISO } from 'date-fns';

/** Canonical day key used everywhere for grouping logs by calendar day. */
export function dayKey(date: Date | number = Date.now()): string {
  return format(date, 'yyyy-MM-dd');
}

/** Day key for `daysAgo` before the given key. Used by streak detection. */
export function dayKeyBefore(key: string, daysAgo: number): string {
  return dayKey(subDays(parseISO(key), daysAgo));
}

/** Start-of-day epoch ms for the given day key. */
export function startOfDayMs(key: string): number {
  return startOfDay(parseISO(key)).getTime();
}

/** Friendly "Today / Yesterday / Mon 5" style label. */
export function friendlyDay(date: Date | number): string {
  const k = dayKey(date);
  const today = dayKey();
  if (k === today) return 'Today';
  if (k === dayKeyBefore(today, 1)) return 'Yesterday';
  return format(date, 'EEE d MMM');
}

export function friendlyTime(date: Date | number): string {
  return format(date, 'h:mm a');
}

/** The last `n` day keys ending today, oldest first. */
export function lastNDayKeys(n: number): string[] {
  const today = dayKey();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(dayKeyBefore(today, i));
  return keys;
}
