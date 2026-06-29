import type { Reminder } from './module';

/**
 * Local reminder/notification helpers built on the Web Notification API.
 *
 * Two delivery paths:
 *  1. **Notification Triggers** (`showTrigger` + `TimestampTrigger`) — where the
 *     browser supports it (Chromium), the service worker fires the reminder at
 *     its scheduled time even if the app/tab is fully closed. This is the
 *     durable path (plan item H / §1.1).
 *  2. **setTimeout fallback** — for browsers without triggers, we fire while the
 *     app is alive. Honest about its limits via the Settings disclaimer.
 *
 * True server-pushed delivery belongs to the deferred clinic-sync phase; this
 * interface stays stable so that upgrade is drop-in.
 */

// Notification Triggers aren't in the default TS lib yet.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class TimestampTrigger {
    constructor(timestamp: number);
  }
  interface NotificationOptions {
    showTrigger?: TimestampTrigger;
  }
  interface GetNotificationOptions {
    includeTriggered?: boolean;
  }
}

const ICON = '/icons/icon-192.png';

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

/** Whether the durable (background) trigger path is available. */
export function triggersSupported(): boolean {
  return (
    notificationsSupported() &&
    typeof window !== 'undefined' &&
    'TimestampTrigger' in window &&
    'serviceWorker' in navigator
  );
}

function show(reminder: Reminder): void {
  if (permissionStatus() !== 'granted') return;
  new Notification(reminder.title, {
    body: reminder.body,
    tag: reminder.id,
    icon: ICON,
    badge: ICON,
  });
}

/** Schedule via the service worker so it survives the app being closed. */
async function scheduleViaTrigger(reminder: Reminder): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(reminder.title, {
      body: reminder.body,
      tag: reminder.id,
      icon: ICON,
      badge: ICON,
      showTrigger: new TimestampTrigger(reminder.dueAt),
    });
    return true;
  } catch {
    return false;
  }
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

  // Durable path: hand the schedule to the service worker.
  if (triggersSupported() && delay > 0) {
    void scheduleViaTrigger(reminder);
    return;
  }

  // Fallback: in-page timers (only while the app stays open).
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

  // Clear any previously-scheduled (still-pending) triggered notifications so
  // we don't double-fire after a re-sync.
  if (triggersSupported()) {
    void navigator.serviceWorker.ready.then((reg) =>
      reg
        .getNotifications({ includeTriggered: true })
        .then((ns) => ns.forEach((n) => n.close()))
        .catch(() => {}),
    );
  }

  for (const r of reminders) scheduleReminder(r);
}
