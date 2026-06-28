import type { HealthModule } from '../../core/module';
import { HeartIcon } from '../../components/icons';
import { bpSchema } from './db';
import { bpInsights } from './insights';
import { BPWidget } from './Widget';
import { BPHome } from './BPHome';
import { BPForm } from './BPForm';

export const bloodPressureModule: HealthModule = {
  id: 'bloodpressure',
  title: 'Blood Pressure',
  description: 'Log systolic/diastolic readings and track trends over time.',
  icon: <HeartIcon />,
  accent: 'sky',
  primaryNav: false,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, bpSchema);
  },
  routes: [
    { index: true, element: <BPHome /> },
    { path: 'log', element: <BPForm /> },
  ],
  DashboardWidget: BPWidget,
  getInsights: bpInsights,
};
