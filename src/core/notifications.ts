import type { Reminder } from './module';

/**
 * Local reminder/notification helpers built on the Web Notification API.
 *
 * This is a pragmatic, offline-friendly scheduler: while the app (or its
 * service worker) is alive it fires due reminders via setTimeout. True
 * background delivery when the app is fully closed requires the Push API +
 * a server, which belongs to the deferred clinic-sync phase. The interface
 * here is intentionally stable so that upgrade is drop-in.
 */

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionStatus(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied';
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  return Notification.requestPermission();
}

function show(reminder: Reminder): void {
  if (permissionStatus() !== 'granted') return;
  new Notification(reminder.title, {
    body: reminder.body,
    tag: reminder.id, // dedupe re-fires of the same reminder
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule a single reminder. Reminders already past their due time within the
 * last 5 minutes fire immediately (covers the app having just been opened);
 * older ones are skipped to avoid spamming on launch.
 */
export function scheduleReminder(reminder: Reminder): void {
  cancelReminder(reminder.id);
  const delay = reminder.dueAt - Date.now();
  if (delay < -5 * 60_000) return;
  if (delay <= 0) {
    show(reminder);
    return;
  }
  // setTimeout caps near 2^31ms (~24.8 days); only schedule within range.
  if (delay > 2_147_000_000) return;
  timers.set(
    reminder.id,
    setTimeout(() => {
      show(reminder);
      timers.delete(reminder.id);
    }, delay),
  );
}

export function cancelReminder(id: string): void {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
}

/** Replace all scheduled reminders with a fresh set (idempotent re-sync). */
export function syncReminders(reminders: Reminder[]): void {
  for (const id of [...timers.keys()]) cancelReminder(id);
  for (const r of reminders) scheduleReminder(r);
}
