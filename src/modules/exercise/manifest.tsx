import type { HealthModule } from '../../core/module';
import { DumbbellIcon } from '../../components/icons';
import { exerciseSchema } from './db';
import { exerciseInsights } from './insights';
import { ExerciseWidget } from './Widget';
import { ExerciseHome } from './ExerciseHome';
import { ExerciseForm } from './ExerciseForm';

export const exerciseModule: HealthModule = {
  id: 'exercise',
  title: 'Exercise',
  description: 'Log walks, runs and activities to track your active minutes.',
  icon: <DumbbellIcon />,
  accent: 'amber',
  primaryNav: false,
  schemaVersion: 1,
  registerSchema(schema) {
    Object.assign(schema, exerciseSchema);
  },
  routes: [
    { index: true, element: <ExerciseHome /> },
    { path: 'log', element: <ExerciseForm /> },
  ],
  DashboardWidget: ExerciseWidget,
  getInsights: exerciseInsights,
};
