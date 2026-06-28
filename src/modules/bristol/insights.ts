import type { Insight } from '../../core/module';
import { makeInsight } from '../../core/insights';
import { lastNDayKeys } from '../../core/dates';
import { bristolLogsTable } from './db';

const MODULE_ID = 'bristol';

export async function bristolInsights(): Promise<Insight[]> {
  const windowKeys = lastNDayKeys(14);
  const logs = await bristolLogsTable().where('dayKey').anyOf(windowKeys).toArray();
  if (logs.length < 2) return [];

  const insights: Insight[] = [];

  // Check for persistent loose / constipation types
  const recentTypes = logs.slice(-5).map((l) => l.type);
  const recentConstipation = recentTypes.filter((t) => t <= 2).length;
  const recentLoose = recentTypes.filter((t) => t >= 6).length;

  if (recentConstipation >= 3) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'nudge',
        title: 'Signs of constipation',
        body: 'Several recent entries suggest constipation. Drinking more water and eating more fibre can help. Talk to your doctor if it persists.',
      }),
    );
  } else if (recentLoose >= 3) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'nudge',
        title: 'Loose stools recently',
        body: 'Several recent entries are on the looser end. Stay hydrated and consider speaking with your doctor if this continues.',
      }),
    );
  }

  // Frequency: more than 3/day or less than 1 every 3 days
  const last7Keys = lastNDayKeys(7);
  const last7Count = logs.filter((l) => last7Keys.includes(l.dayKey)).length;
  const avg = last7Count / 7;
  if (avg > 3) {
    insights.push(
      makeInsight({
        moduleId: MODULE_ID,
        severity: 'info',
        title: 'Higher than average frequency',
        body: `You've logged about ${avg.toFixed(1)} movements per day this week. More than 3/day is worth monitoring.`,
      }),
    );
  } else if (last7Count === 0 && logs.length > 0) {
    const daysSinceLast = windowKeys.findIndex((k) => logs.some((l) => l.dayKey === k));
    if (daysSinceLast >= 3) {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: 'nudge',
          title: 'No entries logged recently',
          body: "You haven't logged a bowel movement in a few days. If this reflects actual infrequency, increase fluids and fibre.",
        }),
      );
    }
  }

  return insights;
}
