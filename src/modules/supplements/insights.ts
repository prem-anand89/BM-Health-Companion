import type { Insight } from '../../core/module';
import { makeInsight } from '../../core/insights';
import { dayKey, dayKeyBefore, lastNDayKeys } from '../../core/dates';
import { supplementsTable, supplementLogsTable } from './db';
import { buildDayDoses, dayAdherence, dueSlots } from './schedule';

const MODULE_ID = 'supplements';

export async function supplementInsights(): Promise<Insight[]> {
  const supps = (await supplementsTable().toArray()).filter((s) => !s.archived);
  if (supps.length === 0) return [];

  const windowKeys = lastNDayKeys(14);
  const logs = await supplementLogsTable().where('dayKey').anyOf(windowKeys).toArray();
  const logsByDay = new Map<string, typeof logs>();
  for (const log of logs) {
    const arr = logsByDay.get(log.dayKey) ?? [];
    arr.push(log);
    logsByDay.set(log.dayKey, arr);
  }

  const insights: Insight[] = [];
  const today = dayKey();

  // Adherence streak
  let streak = 0;
  for (let i = 1; ; i++) {
    const key = dayKeyBefore(today, i);
    if (!windowKeys.includes(key)) break;
    const doses = buildDayDoses(supps, logsByDay.get(key) ?? [], key);
    if (doses.length === 0) break;
    const { ratio } = dayAdherence(doses);
    if (ratio >= 1) streak++;
    else break;
  }
  if (streak >= 3) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'celebrate',
        title: `${streak}-day supplement streak!`,
        body: `You've taken every supplement for ${streak} days in a row. Great consistency!`,
      }),
    );
  }

  // Missed supplements earlier today
  const todaysDoses = buildDayDoses(supps, logsByDay.get(today) ?? [], today);
  const nowHM = new Date().toTimeString().slice(0, 5);
  const missed = todaysDoses.filter((d) => d.status === 'pending' && d.time < nowHM);
  if (missed.length > 0) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'nudge',
        title: missed.length === 1 ? 'A supplement is waiting' : `${missed.length} supplements are waiting`,
        body: `${missed.map((d) => d.supp.name).join(', ')} — tap to record.`,
        cta: { label: 'Open supplements', to: '/m/supplements' },
      }),
    );
  }

  // Refill warnings
  for (const supp of supps) {
    if (supp.quantityRemaining == null) continue;
    const perDay = dueSlots(supp, today).length || supp.times.length;
    if (perDay <= 0) continue;
    const daysLeft = Math.floor(supp.quantityRemaining / perDay);
    if (daysLeft <= 5) {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: daysLeft <= 2 ? 'warning' : 'nudge',
          title: `${supp.name} is running low`,
          body: `About ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. Consider reordering.`,
        }),
      );
    }
  }

  return insights;
}
