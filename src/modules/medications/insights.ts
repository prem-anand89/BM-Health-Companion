import type { Insight } from '../../core/module';
import { makeInsight } from '../../core/insights';
import { dayKey, dayKeyBefore, lastNDayKeys } from '../../core/dates';
import { medicationsTable, medLogsTable } from './db';
import { buildDayDoses, dayAdherence, dueSlots } from './schedule';

const MODULE_ID = 'medications';

/**
 * Rule-based coaching for medications:
 *  - adherence streak (motivate)
 *  - missed doses earlier today (nudge / warning)
 *  - refill-soon estimate from remaining quantity (warning)
 *  - 7-day adherence summary (info)
 */
export async function medicationInsights(): Promise<Insight[]> {
  const meds = (await medicationsTable().toArray()).filter((m) => !m.archived);
  if (meds.length === 0) return [];

  const windowKeys = lastNDayKeys(14);
  const logs = await medLogsTable()
    .where('dayKey')
    .anyOf(windowKeys)
    .toArray();
  const logsByDay = new Map<string, typeof logs>();
  for (const log of logs) {
    const arr = logsByDay.get(log.dayKey) ?? [];
    arr.push(log);
    logsByDay.set(log.dayKey, arr);
  }

  const insights: Insight[] = [];
  const today = dayKey();

  // --- Adherence streak: consecutive past days with everything taken. ---
  let streak = 0;
  for (let i = 1; ; i++) {
    const key = dayKeyBefore(today, i);
    if (!windowKeys.includes(key)) break;
    const doses = buildDayDoses(meds, logsByDay.get(key) ?? [], key);
    if (doses.length === 0) break; // nothing scheduled — stop counting
    const { ratio } = dayAdherence(doses);
    if (ratio >= 1) streak++;
    else break;
  }
  if (streak >= 2) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'celebrate',
        title: `${streak}-day medication streak!`,
        body: `You've taken every scheduled dose for ${streak} days running. Keep it up.`,
      }),
    );
  }

  // --- Missed doses earlier today (past their slot, still pending). ---
  const todaysDoses = buildDayDoses(meds, logsByDay.get(today) ?? [], today);
  const nowHM = new Date().toTimeString().slice(0, 5);
  const missed = todaysDoses.filter(
    (d) => d.status === 'pending' && d.time < nowHM,
  );
  if (missed.length > 0) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'warning',
        title:
          missed.length === 1
            ? 'A dose is waiting'
            : `${missed.length} doses are waiting`,
        body: `${missed
          .map((d) => `${d.med.name} (${d.time})`)
          .join(', ')} — tap to mark as taken or skipped.`,
        cta: { label: 'Open today', to: '/m/medications' },
      }),
    );
  }

  // --- Refill estimate from remaining quantity vs daily usage. ---
  for (const med of meds) {
    if (med.quantityRemaining == null) continue;
    const perDay = dueSlots(med, today).length || med.times.length;
    if (perDay <= 0) continue;
    const daysLeft = Math.floor(med.quantityRemaining / perDay);
    if (daysLeft <= 5) {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: daysLeft <= 2 ? 'warning' : 'nudge',
          title: `${med.name} is running low`,
          body: `About ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. Consider ordering a refill.`,
        }),
      );
    }
  }

  // --- 7-day adherence summary (educational/info). ---
  const last7 = lastNDayKeys(7);
  let due7 = 0;
  let taken7 = 0;
  for (const key of last7) {
    const doses = buildDayDoses(meds, logsByDay.get(key) ?? [], key);
    const a = dayAdherence(doses);
    due7 += a.due;
    taken7 += a.taken;
  }
  if (due7 > 0) {
    const pct = Math.round((taken7 / due7) * 100);
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'info',
        title: `7-day adherence: ${pct}%`,
        body:
          pct >= 90
            ? 'Excellent consistency this week.'
            : pct >= 70
              ? 'Good week — a little room to improve.'
              : 'Let’s aim for more consistency next week. Reminders can help.',
      }),
    );
  }

  return insights;
}
