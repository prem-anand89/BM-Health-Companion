import type { HealthModule } from '../../core/module';
import { LeafIcon } from '../../components/icons';
import { bristolSchema } from './db';
import { bristolInsights } from './insights';
import { BristolWidget } from './Widget';
import { BristolHome } from './BristolHome';
import { BristolForm } from './BristolForm';

export const bristolModule: HealthModule = {
  id: 'bristol',
  title: 'Bowel Health',
  description: 'Log bowel movements using the Bristol Stool Scale.',
  icon: <LeafIcon />,
  accent: 'rose',
  primaryNav: false,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, bristolSchema);
  },
  routes: [
    { index: true, element: <BristolHome /> },
    { path: 'log', element: <BristolForm /> },
  ],
  DashboardWidget: BristolWidget,
  getInsights: bristolInsights,
};
