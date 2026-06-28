import type { HealthModule } from '../../core/module';
import { PulseIcon } from '../../components/icons';
import { symptomsSchema } from './db';
import { symptomInsights } from './insights';
import { SymptomsWidget } from './Widget';
import { SymptomsHome } from './SymptomsHome';
import { SymptomLog } from './SymptomLog';

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
};
