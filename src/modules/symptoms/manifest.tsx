import type { HealthModule, Reminder } from '../../core/module';
import { PulseIcon } from '../../components/icons';
import { symptomsSchema } from './db';
import { symptomInsights } from './insights';
import { SymptomsWidget } from './Widget';
import { SymptomsHome } from './SymptomsHome';
import { SymptomLog } from './SymptomLog';
import { getPreferences } from '../../core/preferences';
import { dayKey, startOfDayMs } from '../../core/dates';

async function getReminders(): Promise<Reminder[]> {
  const { symptomReminderTime } = getPreferences();
  if (!symptomReminderTime) return [];
  const [h, m] = symptomReminderTime.split(':').map(Number);
  const dueAt = startOfDayMs(dayKey()) + (h * 60 + m) * 60_000;
  return [
    {
      id: `symptoms-checkin-${dayKey()}`,
      moduleId: 'symptoms',
      title: 'Daily symptom check-in',
      body: 'How are you feeling today? Tap to log.',
      dueAt,
    },
  ];
}

export const symptomsModule: HealthModule = {
  id: 'symptoms',
  title: 'Symptoms',
  description: 'Log how you feel and watch trends.',
  icon: <PulseIcon />,
  accent: 'rose',
  primaryNav: true,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, symptomsSchema);
  },
  routes: [
    { index: true, element: <SymptomsHome /> },
    { path: 'log', element: <SymptomLog /> },
  ],
  DashboardWidget: SymptomsWidget,
  getInsights: symptomInsights,
  getReminders,
};
