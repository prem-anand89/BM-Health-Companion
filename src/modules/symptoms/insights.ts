import type { Insight } from '../../core/module';
import { makeInsight, trend, mean } from '../../core/insights';
import { dayKey, dayKeyBefore } from '../../core/dates';
import { symptomsTable, type Symptom } from './db';

const MODULE_ID = 'symptoms';

/**
 * Rule-based coaching for symptoms:
 *  - severity trend over the last ~2 weeks (improving / worsening)
 *  - frequency spike vs. the prior week (nudge)
 *  - a gentle "most troublesome symptom" educational note
 *  These describe patterns only; they never claim medical causation.
 */
export async function symptomInsights(): Promise<Insight[]> {
  const today = dayKey();
  const since = startOfWindow(14);
  const recent = await symptomsTable()
    .where('recordedAt')
    .aboveOrEqual(since)
    .toArray();
  if (recent.length < 2) return [];

  const insights: Insight[] = [];

  // --- Overall severity trend (chronological mean per day). ---
  const byDay = groupMeanByDay(recent);
  const series = byDay.map((d) => d.mean);
  if (series.length >= 4) {
    const t = trend(series, 0.6);
    if (t.direction === 'down') {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: 'celebrate',
          title: 'Symptoms are easing',
          body: `Average severity is trending down (from ${t.earlierMean.toFixed(
            1,
          )} to ${t.recentMean.toFixed(1)} out of 10). Whatever you're doing seems to help.`,
        }),
      );
    } else if (t.direction === 'up') {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: 'warning',
          title: 'Symptoms are trending up',
          body: `Average severity rose from ${t.earlierMean.toFixed(
            1,
          )} to ${t.recentMean.toFixed(1)} out of 10 recently. Keep logging — and consider discussing it with your clinician.`,
          cta: { label: 'Log how you feel', to: '/m/symptoms' },
        }),
      );
    }
  }

  // --- Frequency spike: this week vs. previous week. ---
  const weekAgo = dayKeyBefore(today, 7);
  const thisWeek = recent.filter((s) => s.dayKey > weekAgo).length;
  const prevWeek = recent.length - thisWeek;
  if (prevWeek > 0 && thisWeek >= prevWeek * 2 && thisWeek >= 4) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'nudge',
        title: 'More entries than usual this week',
        body: `You've logged ${thisWeek} symptoms this week vs. ${prevWeek} the week before. A pattern may be emerging.`,
      }),
    );
  }

  // --- Most troublesome symptom (educational). ---
  const worst = highestAverageType(recent);
  if (worst && worst.count >= 3) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'info',
        title: `${worst.type} is your most reported symptom`,
        body: `Logged ${worst.count} times recently with an average severity of ${worst.avg.toFixed(
          1,
        )}/10. Tracking triggers (food, sleep, activity) can reveal what helps.`,
      }),
    );
  }

  return insights;
}

function startOfWindow(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function groupMeanByDay(symptoms: Symptom[]): { day: string; mean: number }[] {
  const map = new Map<string, number[]>();
  for (const s of symptoms) {
    const arr = map.get(s.dayKey) ?? [];
    arr.push(s.severity);
    map.set(s.dayKey, arr);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, vals]) => ({ day, mean: mean(vals) }));
}

function highestAverageType(
  symptoms: Symptom[],
): { type: string; avg: number; count: number } | null {
  const map = new Map<string, number[]>();
  for (const s of symptoms) {
    const arr = map.get(s.type) ?? [];
    arr.push(s.severity);
    map.set(s.type, arr);
  }
  let best: { type: string; avg: number; count: number } | null = null;
  for (const [type, vals] of map) {
    const avg = mean(vals);
    if (!best || avg > best.avg) best = { type, avg, count: vals.length };
  }
  return best;
}
