import type { HealthModule, Reminder } from '../../core/module';
import { FlaskIcon } from '../../components/icons';
import { supplementsSchema, supplementsTable, supplementLogsTable } from './db';
import { buildDayDoses } from './schedule';
import { dayKey, startOfDayMs } from '../../core/dates';
import { supplementInsights } from './insights';
import { SupplementsWidget } from './Widget';
import { SupplementsHome } from './SupplementsHome';
import { SupplementForm } from './SupplementForm';
import { SupplementList } from './SupplementList';

async function getReminders(): Promise<Reminder[]> {
  const today = dayKey();
  const supps = (await supplementsTable().toArray()).filter((s) => !s.archived);
  const logs = await supplementLogsTable().where('dayKey').equals(today).toArray();
  const doses = buildDayDoses(supps, logs, today);
  const midnight = startOfDayMs(today);

  return doses
    .filter((d) => d.status === 'pending')
    .map((d) => {
      const [h, m] = d.time.split(':').map(Number);
      return {
        id: `supp-${d.supp.id}-${today}-${d.time}`,
        moduleId: 'supplements',
        title: `Time for ${d.supp.name}`,
        body: `${d.supp.dose} · ${d.supp.form}`,
        dueAt: midnight + (h * 60 + m) * 60_000,
      };
    });
}

export const supplementsModule: HealthModule = {
  id: 'supplements',
  title: 'Supplements',
  description: 'Track vitamins, minerals and other supplements.',
  icon: <FlaskIcon />,
  accent: 'amber',
  primaryNav: true,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, supplementsSchema);
  },
  routes: [
    { index: true, element: <SupplementsHome /> },
    { path: 'new', element: <SupplementForm /> },
    { path: 'list', element: <SupplementList /> },
    { path: ':id/edit', element: <SupplementForm /> },
  ],
  DashboardWidget: SupplementsWidget,
  getInsights: supplementInsights,
  getReminders,
};
