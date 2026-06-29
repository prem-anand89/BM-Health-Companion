import type { HealthModule, Insight } from './module';
import { makeInsight } from './insights';
import { getPreferences } from './preferences';
import { db } from './db';

const THIRTY_DAYS = 30 * 24 * 60 * 60_000;

/**
 * Local-only data is one wiped device away from total loss. If the patient has
 * data but hasn't exported in a while, surface a gentle, low-priority nudge to
 * back up (plan item G / §1.3). Reuses the existing insights feed rather than a
 * new notification type.
 */
export async function backupInsights(modules: HealthModule[]): Promise<Insight[]> {
  const { lastExportAt } = getPreferences();
  const fresh = lastExportAt != null && Date.now() - lastExportAt < THIRTY_DAYS;
  if (fresh) return [];

  // Only nudge once there's actually something worth losing.
  let total = 0;
  for (const m of modules) {
    const stores: Record<string, string> = {};
    m.registerSchema(stores);
    for (const table of Object.keys(stores)) {
      try {
        total += await db.t(table).count();
      } catch {
        /* table not ready yet — ignore */
      }
    }
    if (total > 0) break;
  }
  if (total === 0) return [];

  return [
    makeInsight({
      moduleId: 'core',
      severity: 'info',
      title: 'Back up your health data',
      body:
        lastExportAt == null
          ? 'Your data lives only on this device. Export a copy so a lost or reset phone never means losing your history.'
          : "It's been a while since your last backup. Export a fresh copy to keep it safe.",
      cta: { label: 'Export now', to: '/settings' },
    }),
  ];
}
