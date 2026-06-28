import type { HealthModule, Insight, Reminder } from './module';
import { applyModuleSchema } from './db';
import { rankInsights } from './insights';
import { medicationsModule } from '../modules/medications/manifest';
import { symptomsModule } from '../modules/symptoms/manifest';
import { supplementsModule } from '../modules/supplements/manifest';

/**
 * The ordered list of installed modules. THIS is the single place you touch to
 * add a feature: build a manifest under src/modules/<name>/ and add it here.
 * Everything else — nav, dashboard, schema, insights, reminders — assembles
 * itself from this array.
 */
export const modules: HealthModule[] = [medicationsModule, symptomsModule, supplementsModule];

export function getModule(id: string): HealthModule | undefined {
  return modules.find((m) => m.id === id);
}

/** Modules that appear as primary bottom-nav tabs. */
export function primaryNavModules(): HealthModule[] {
  return modules.filter((m) => m.primaryNav);
}

let dbInitialized = false;
/** Apply every module's schema and open the database. Idempotent. */
export function initDb(): void {
  if (dbInitialized) return;
  dbInitialized = true;
  applyModuleSchema(modules);
}

/** Gather, merge and rank insights from every module. */
export async function collectInsights(): Promise<Insight[]> {
  const all = await Promise.all(
    modules.map(async (m) => {
      try {
        return await m.getInsights();
      } catch {
        return [] as Insight[];
      }
    }),
  );
  return rankInsights(all.flat());
}

/** Gather reminders from every module that produces them. */
export async function collectReminders(): Promise<Reminder[]> {
  const all = await Promise.all(
    modules.map(async (m) => {
      try {
        return (await m.getReminders?.()) ?? [];
      } catch {
        return [] as Reminder[];
      }
    }),
  );
  return all.flat();
}
