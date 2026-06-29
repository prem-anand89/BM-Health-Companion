import { useLiveQuery } from 'dexie-react-hooks';
import { medicationsTable } from './db';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { PillIcon } from '../../components/icons';

/** Removed medications, with the option to restore them (plan item F / §1.2). */
export function MedicationArchived() {
  const meds = useLiveQuery(
    async () =>
      (await medicationsTable().toArray())
        .filter((m) => m.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  async function restore(id: number) {
    await medicationsTable().update(id, { archived: false });
  }

  return (
    <div>
      <PageHeader title="Archived medications" back />

      {!meds ? null : meds.length === 0 ? (
        <EmptyState icon={<PillIcon />} title="Nothing archived" body="Removed medications show up here so you can restore them." />
      ) : (
        <ul className="space-y-3">
          {meds.map((m) => (
            <li key={m.id}>
              <Card className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">
                    {m.name} <span className="font-normal text-slate-500">· {m.dose}</span>
                  </p>
                  <p className="truncate text-sm text-slate-500">{m.times.join(', ')}</p>
                </div>
                <button
                  className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 active:scale-95"
                  onClick={() => restore(m.id!)}
                >
                  Restore
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
