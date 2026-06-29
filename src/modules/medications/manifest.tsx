import type { HealthModule, Reminder } from '../../core/module';
import { PillIcon } from '../../components/icons';
import { medicationsSchema, medicationsTable, medLogsTable } from './db';
import { buildDayDoses } from './schedule';
import { dayKey, startOfDayMs } from '../../core/dates';
import { medicationInsights } from './insights';
import { MedicationsWidget } from './Widget';
import { MedicationsHome } from './MedicationsHome';
import { MedicationForm } from './MedicationForm';
import { MedicationList } from './MedicationList';
import { MedicationArchived } from './MedicationArchived';

/** Build reminders for today's still-pending doses at their scheduled times. */
async function getReminders(): Promise<Reminder[]> {
  const today = dayKey();
  const meds = (await medicationsTable().toArray()).filter((m) => !m.archived);
  const logs = await medLogsTable().where('dayKey').equals(today).toArray();
  const doses = buildDayDoses(meds, logs, today);
  const midnight = startOfDayMs(today);

  return doses
    .filter((d) => d.status === 'pending')
    .map((d) => {
      const [h, m] = d.time.split(':').map(Number);
      return {
        id: `med-${d.med.id}-${today}-${d.time}`,
        moduleId: 'medications',
        title: `Time for ${d.med.name}`,
        body: `${d.med.dose} · ${d.med.form}`,
        dueAt: midnight + (h * 60 + m) * 60_000,
      };
    });
}

export const medicationsModule: HealthModule = {
  id: 'medications',
  title: 'Meds',
  description: 'Track doses, adherence and refills.',
  icon: <PillIcon />,
  accent: 'brand',
  primaryNav: true,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, medicationsSchema);
  },
  routes: [
    { index: true, element: <MedicationsHome /> },
    { path: 'new', element: <MedicationForm /> },
    { path: 'list', element: <MedicationList /> },
    { path: 'archived', element: <MedicationArchived /> },
    { path: ':id/edit', element: <MedicationForm /> },
  ],
  DashboardWidget: MedicationsWidget,
  getInsights: medicationInsights,
  getReminders,
};
