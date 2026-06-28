import Dexie, { type Table } from 'dexie';
import type { HealthModule } from './module';

/**
 * The single app-wide IndexedDB database. Modules do NOT each open their own
 * database; instead every module contributes its tables to this shared Dexie
 * instance via `registerSchema`. This keeps cross-module queries and the
 * insight engine simple while still isolating each module's code.
 *
 * Modules import `db` and read/write their tables lazily (inside functions),
 * never at module top-level, so this file imports nothing from modules.
 */
export class HealthDB extends Dexie {
  constructor() {
    super('bm-health');
  }

  /** Typed accessor for a module's table. */
  t<T = unknown>(name: string): Table<T> {
    return this.table(name) as Table<T>;
  }
}

export const db = new HealthDB();

let schemaApplied = false;

/**
 * Combine every module's schema into one Dexie version and open the database.
 * Called once from the registry's `initDb`.
 */
export function applyModuleSchema(modules: HealthModule[]): void {
  if (schemaApplied) return;
  schemaApplied = true;

  const stores: Record<string, string> = {};
  // Base version starts at 1; each module's schemaVersion bumps it so adding
  // or migrating a module's tables triggers a clean Dexie upgrade.
  let version = 1;
  for (const m of modules) {
    m.registerSchema(stores);
    version += m.schemaVersion;
  }

  db.version(version).stores(stores);
  void db.open();

  for (const m of modules) m.onDbReady?.(db);
}
