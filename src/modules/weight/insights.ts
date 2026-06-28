import type { Insight } from '../../core/module';
import { makeInsight, trend } from '../../core/insights';
import { lastNDayKeys } from '../../core/dates';
import { weightLogsTable, toKg, calcBMI, bmiCategory } from './db';
import { getPreferences } from '../../core/preferences';

const MODULE_ID = 'weight';

export async function weightInsights(): Promise<Insight[]> {
  const { heightCm } = getPreferences();
  const windowKeys = lastNDayKeys(30);
  const logs = await weightLogsTable().where('dayKey').anyOf(windowKeys).toArray();
  if (logs.length < 2) return [];

  const insights: Insight[] = [];

  // Convert to kg for all comparisons
  const kgValues = logs.map((l) => toKg(l.value, l.unit));

  // Trend over the window
  if (kgValues.length >= 4) {
    const t = trend(kgValues, 0.5);
    const totalChange = kgValues[kgValues.length - 1] - kgValues[0];
    if (Math.abs(totalChange) >= 1) {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: 'info',
          title: `Weight has ${t.direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(totalChange).toFixed(1)} kg`,
          body:
            t.direction === 'up'
              ? 'Your weight has been increasing. Consider discussing this with your care team.'
              : 'Your weight has been decreasing. If intentional, great work!',
        }),
      );
    }
  }

  // BMI insight if height is set
  if (heightCm) {
    const latestKg = kgValues[kgValues.length - 1];
    const bmi = calcBMI(latestKg, heightCm);
    const cat = bmiCategory(bmi);
    if (cat !== 'Normal') {
      insights.push(
        makeInsight({
          moduleId: MODULE_ID,
          severity: cat === 'Obese' ? 'nudge' : 'info',
          title: `BMI is ${bmi.toFixed(1)} (${cat})`,
          body:
            cat === 'Underweight'
              ? 'A BMI below 18.5 is considered underweight. Talk to your doctor about a healthy plan.'
              : cat === 'Overweight'
                ? 'A BMI between 25–30 is overweight. Even small changes in diet and activity help.'
                : 'A BMI above 30 is in the obese range. Your doctor can help you set realistic goals.',
        }),
      );
    }
  }

  return insights;
}
