import type { HealthModule } from '../../core/module';
import { ScaleIcon } from '../../components/icons';
import { weightSchema } from './db';
import { weightInsights } from './insights';
import { WeightWidget } from './Widget';
import { WeightHome } from './WeightHome';
import { WeightForm } from './WeightForm';

export const weightModule: HealthModule = {
  id: 'weight',
  title: 'Weight',
  description: 'Log your body weight and track trends over time.',
  icon: <ScaleIcon />,
  accent: 'emerald',
  primaryNav: false,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, weightSchema);
  },
  routes: [
    { index: true, element: <WeightHome /> },
    { path: 'log', element: <WeightForm /> },
  ],
  DashboardWidget: WeightWidget,
  getInsights: weightInsights,
};
