import type { Insight } from './module';
import { correlation, makeInsight, mean } from './insights';
import { lastNDayKeys } from './dates';
import { symptomsTable } from '../modules/symptoms/db';
import { medicationsTable, medLogsTable } from '../modules/medications/db';
import { buildDayDoses, dayAdherence } from '../modules/medications/schedule';

/**
 * Cross-module insights: correlates symptom severity against medication
 * adherence over a 14-day window. Presented as a possible pattern, never
 * medical causation.
 */
export async function correlationInsights(): Promise<Insight[]> {
  const windowKeys = lastNDayKeys(14);
  const insights: Insight[] = [];

  const [symptoms, meds, logs] = await Promise.all([
    symptomsTable().where('dayKey').anyOf(windowKeys).toArray(),
    medicationsTable().toArray().then((all) => all.filter((m) => !m.archived)),
    medLogsTable().where('dayKey').anyOf(windowKeys).toArray(),
  ]);

  if (meds.length === 0 || symptoms.length < 5) return [];

  const severityByDay = new Map<string, number[]>();
  for (const s of symptoms) {
    const arr = severityByDay.get(s.dayKey) ?? [];
    arr.push(s.severity);
    severityByDay.set(s.dayKey, arr);
  }

  const logsByDay = new Map<string, typeof logs>();
  for (const log of logs) {
    const arr = logsByDay.get(log.dayKey) ?? [];
    arr.push(log);
    logsByDay.set(log.dayKey, arr);
  }

  const severityArr: number[] = [];
  const nonAdherenceArr: number[] = [];

  for (const key of windowKeys) {
    const sevVals = severityByDay.get(key);
    if (!sevVals || sevVals.length === 0) continue;
    const doses = buildDayDoses(meds, logsByDay.get(key) ?? [], key);
    if (doses.length === 0) continue;
    const { ratio } = dayAdherence(doses);
    severityArr.push(mean(sevVals));
    nonAdherenceArr.push(1 - ratio);
  }

  if (severityArr.length < 5) return [];

  const r = correlation(severityArr, nonAdherenceArr);

  if (r > 0.4) {
    insights.push(
      makeInsight({
        moduleId: 'symptoms',
        severity: 'nudge',
        title: 'Symptoms may be linked to missed doses',
        body: 'Your symptoms tend to be worse on days when medications are missed. This pattern is worth discussing with your doctor.',
        cta: { label: 'View medications', to: '/m/medications' },
      }),
    );
  } else if (r < -0.4) {
    insights.push(
      makeInsight({
        moduleId: 'symptoms',
        severity: 'celebrate',
        title: 'Medications appear to be helping',
        body: 'Your symptoms tend to be lower on days you take your medications. Keep up the consistency!',
        cta: { label: 'See your report', to: '/report' },
      }),
    );
  }

  return insights;
}
