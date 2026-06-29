import type { Insight } from '../../core/module';
import { makeInsight, trend } from '../../core/insights';
import { lastNDayKeys } from '../../core/dates';
import { bpLogsTable, classifyBP } from './db';

const MODULE_ID = 'bloodpressure';

export async function bpInsights(): Promise<Insight[]> {
  const windowKeys = lastNDayKeys(14);
  const logs = await bpLogsTable().where('dayKey').anyOf(windowKeys).toArray();
  if (logs.length < 1) return [];

  const insights: Insight[] = [];
  const latest = logs[logs.length - 1];
  const cat = classifyBP(latest.systolic, latest.diastolic);

  // Alert for high readings
  if (cat === 'crisis') {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'warning',
        title: 'Critical blood pressure — seek help',
        body: `Your latest reading (${latest.systolic}/${latest.diastolic}) is in the crisis range. Call your doctor or emergency services immediately.`,
      }),
    );
  } else if (cat === 'high2') {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'warning',
        title: 'Blood pressure is high (Stage 2)',
        body: `${latest.systolic}/${latest.diastolic} mmHg. Contact your doctor soon to review your treatment plan.`,
        cta: { label: 'Log another reading', to: '/m/bloodpressure/log' },
      }),
    );
  } else if (cat === 'high1') {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'nudge',
        title: 'Blood pressure slightly elevated',
        body: `${latest.systolic}/${latest.diastolic} mmHg (Stage 1 high). Lifestyle changes like reducing salt and staying active can help.`,
      }),
    );
  } else if (cat === 'low') {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'warning',
        title: 'Blood pressure is low',
        body: `${latest.systolic}/${latest.diastolic} mmHg is on the low side, which can cause dizziness or falls. Stand up slowly, stay hydrated, and mention it to your doctor if it keeps happening.`,
        cta: { label: 'Log another reading', to: '/m/bloodpressure/log' },
      }),
    );
  }

  // Systolic trend
  if (logs.length >= 4) {
    const byDay = new Map<string, number[]>();
    for (const l of logs) {
      const arr = byDay.get(l.dayKey) ?? [];
      arr.push(l.systolic);
      byDay.set(l.dayKey, arr);
    }
    const dailyMeans = windowKeys
      .map((k) => {
        const v = byDay.get(k);
        return v ? v.reduce((s, x) => s + x, 0) / v.length : null;
      })
      .filter((v): v is number => v !== null);

    if (dailyMeans.length >= 4) {
      const t = trend(dailyMeans, 3);
      if (t.direction === 'down' && t.recentMean < 130) {
        insights.push(
          makeInsight({
            moduleId: MODULE_ID,
            severity: 'celebrate',
            title: 'Blood pressure is improving',
            body: `Your systolic readings have been trending down. Keep up with your medications and lifestyle habits.`,
          }),
        );
      } else if (t.direction === 'up' && t.recentMean >= 130) {
        insights.push(
          makeInsight({
            moduleId: MODULE_ID,
            severity: 'nudge',
            title: 'Blood pressure trending up',
            body: `Systolic is rising on average. Discuss with your doctor if this continues.`,
          }),
        );
      }
    }
  }

  return insights;
}
