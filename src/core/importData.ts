import { db } from './db';
import type { HealthModule } from './module';

export type RestoreMode = 'merge' | 'replace';

export interface RestoreResult {
  tables: { table: string; count: number }[];
  total: number;
}

/** Collect every valid table name from the installed modules' schemas. */
function knownTables(modules: HealthModule[]): Set<string> {
  const stores: Record<string, string> = {};
  for (const m of modules) m.registerSchema(stores);
  return new Set(Object.keys(stores));
}

/**
 * Restore an exported JSON dump (shape `{ exportedAt, [table]: rows[] }`, as
 * produced by Settings → Export). Only tables the app actually knows about are
 * touched. `merge` upserts by id (bulkPut); `replace` clears each table first.
 * Preferences live in localStorage and are not part of the dump.
 */
export async function restoreFromJson(
  json: unknown,
  mode: RestoreMode,
  modules: HealthModule[],
): Promise<RestoreResult> {
  if (!json || typeof json !== 'object') {
    throw new Error('That file is not a valid backup.');
  }
  const dump = json as Record<string, unknown>;
  const valid = knownTables(modules);
  const entries = Object.entries(dump).filter(
    ([key, value]) => valid.has(key) && Array.isArray(value),
  ) as [string, unknown[]][];

  if (entries.length === 0) {
    throw new Error('No recognisable health data found in that file.');
  }

  const result: RestoreResult = { tables: [], total: 0 };

  await db.transaction('rw', entries.map(([t]) => db.t(t)), async () => {
    for (const [table, rows] of entries) {
      const t = db.t(table);
      if (mode === 'replace') await t.clear();
      if (rows.length > 0) await t.bulkPut(rows as never[]);
      result.tables.push({ table, count: rows.length });
      result.total += rows.length;
    }
  });

  return result;
}
