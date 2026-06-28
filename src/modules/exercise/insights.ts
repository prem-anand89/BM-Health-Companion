import type { Insight } from '../../core/module';
import { makeInsight } from '../../core/insights';
import { lastNDayKeys, dayKey, dayKeyBefore } from '../../core/dates';
import { exerciseLogsTable } from './db';

const MODULE_ID = 'exercise';
const WEEKLY_GOAL_MIN = 150; // WHO recommendation

export async function exerciseInsights(): Promise<Insight[]> {
  const windowKeys = lastNDayKeys(14);
  const logs = await exerciseLogsTable().where('dayKey').anyOf(windowKeys).toArray();
  if (logs.length === 0) return [];

  const insights: Insight[] = [];
  const today = dayKey();

  // This week vs last week
  const weekKeys = lastNDayKeys(7);
  const lastWeekKeys = Array.from({ length: 7 }, (_, i) =>
    dayKeyBefore(today, i + 7),
  );

  const thisWeekMin = logs
    .filter((l) => weekKeys.includes(l.dayKey))
    .reduce((s, l) => s + l.duration, 0);
  const lastWeekMin = logs
    .filter((l) => lastWeekKeys.includes(l.dayKey))
    .reduce((s, l) => s + l.duration, 0);

  if (thisWeekMin >= WEEKLY_GOAL_MIN) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'celebrate',
        title: `Weekly goal reached — ${thisWeekMin} minutes!`,
        body: `You've hit the WHO recommended 150 min of activity this week. Excellent work!`,
      }),
    );
  } else if (lastWeekMin >= WEEKLY_GOAL_MIN && thisWeekMin < WEEKLY_GOAL_MIN * 0.5) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'nudge',
        title: 'Activity is down this week',
        body: `You managed ${thisWeekMin} min so far — ${WEEKLY_GOAL_MIN - thisWeekMin} more to hit the weekly goal.`,
        cta: { label: 'Log activity', to: '/m/exercise/log' },
      }),
    );
  }

  // Active streak: consecutive days with any exercise
  const activeDays = new Set(logs.map((l) => l.dayKey));
  let streak = 0;
  for (let i = 0; ; i++) {
    const k = dayKeyBefore(today, i);
    if (!windowKeys.includes(k)) break;
    if (activeDays.has(k)) streak++;
    else break;
  }
  if (streak >= 3) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'celebrate',
        title: `${streak}-day active streak!`,
        body: `You've been active every day for ${streak} days. Keep the momentum going!`,
      }),
    );
  }

  return insights;
}
