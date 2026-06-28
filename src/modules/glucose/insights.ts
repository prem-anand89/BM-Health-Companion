import type { Insight } from '../../core/module';
import { makeInsight, trend } from '../../core/insights';
import { lastNDayKeys } from '../../core/dates';
import { glucoseLogsTable, toMgDl } from './db';
import { getPreferences } from '../../core/preferences';

const MODULE_ID = 'glucose';

export async function glucoseInsights(): Promise<Insight[]> {
  const { glucoseTargetMin, glucoseTargetMax } = getPreferences();
  const windowKeys = lastNDayKeys(14);
  const logs = await glucoseLogsTable().where('dayKey').anyOf(windowKeys).toArray();
  if (logs.length < 2) return [];

  const insights: Insight[] = [];

  // Convert all to mg/dL for consistent comparisons
  const mgdlValues = logs.map((l) => toMgDl(l.value, l.unit));
  const latest = mgdlValues[mgdlValues.length - 1];
  const latestLog = logs[logs.length - 1];

  // High / low alert on most recent reading
  if (latest > glucoseTargetMax) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: latest > glucoseTargetMax * 1.25 ? 'warning' : 'nudge',
        title: 'Glucose above target',
        body: `Latest reading (${latestLog.context}) is above your target range. Log your meals and activity, or check with your doctor if this persists.`,
        cta: { label: 'Log reading', to: '/m/glucose/log' },
      }),
    );
  } else if (latest < glucoseTargetMin) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'warning',
        title: 'Glucose below target',
        body: `Your latest reading is low. Have a small snack and check again. If you feel unwell, seek help immediately.`,
        cta: { label: 'Log reading', to: '/m/glucose/log' },
      }),
    );
  }

  // Trend over last 14 days (daily mean)
  const byDay = new Map<string, number[]>();
  for (let i = 0; i < logs.length; i++) {
    const arr = byDay.get(logs[i].dayKey) ?? [];
    arr.push(mgdlValues[i]);
    byDay.set(logs[i].dayKey, arr);
  }
  const dailyMeans = windowKeys
    .map((k) => {
      const v = byDay.get(k);
      return v ? v.reduce((s, x) => s + x, 0) / v.length : null;
    })
    .filter((v): v is number => v !== null);

  if (dailyMeans.length >= 4) {
    const t = trend(dailyMeans, 5);
    if (t.direction === 'up' && t.recentMean > glucoseTargetMax) {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: 'nudge',
          title: 'Glucose trend is rising',
          body: `Your average glucose has been climbing. Diet, activity and medication adherence all affect this — worth a review.`,
        }),
      );
    } else if (t.direction === 'down' && t.recentMean <= glucoseTargetMax) {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: 'celebrate',
          title: 'Glucose is improving',
          body: `Your readings have been trending down toward your target range. Keep it up!`,
        }),
      );
    }
  }

  return insights;
}
