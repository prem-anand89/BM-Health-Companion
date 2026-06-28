import type { HealthModule } from '../../core/module';
import { DropIcon } from '../../components/icons';
import { glucoseSchema } from './db';
import { glucoseInsights } from './insights';
import { GlucoseWidget } from './Widget';
import { GlucoseHome } from './GlucoseHome';
import { GlucoseForm } from './GlucoseForm';

export const glucoseModule: HealthModule = {
  id: 'glucose',
  title: 'Glucose',
  description: 'Track blood glucose readings and stay within your target range.',
  icon: <DropIcon />,
  accent: 'indigo',
  primaryNav: false,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, glucoseSchema);
  },
  routes: [
    { index: true, element: <GlucoseHome /> },
    { path: 'log', element: <GlucoseForm /> },
  ],
  DashboardWidget: GlucoseWidget,
  getInsights: glucoseInsights,
};
