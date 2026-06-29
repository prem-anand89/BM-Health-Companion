import { useLiveQuery } from 'dexie-react-hooks';
import { supplementsTable } from './db';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { FlaskIcon } from '../../components/icons';

/** Removed supplements, with the option to restore them (plan item F / §1.2). */
export function SupplementArchived() {
  const supps = useLiveQuery(
    async () =>
      (await supplementsTable().toArray())
        .filter((s) => s.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  async function restore(id: number) {
    await supplementsTable().update(id, { archived: false });
  }

  return (
    <div>
      <PageHeader title="Archived supplements" back />

      {!supps ? null : supps.length === 0 ? (
        <EmptyState icon={<FlaskIcon />} title="Nothing archived" body="Removed supplements show up here so you can restore them." />
      ) : (
        <ul className="space-y-3">
          {supps.map((s) => (
            <li key={s.id}>
              <Card className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">
                    {s.name} <span className="font-normal text-slate-500">· {s.dose}</span>
                  </p>
                  <p className="truncate text-sm text-slate-500">{s.times.join(', ')}</p>
                </div>
                <button
                  className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 active:scale-95"
                  onClick={() => restore(s.id!)}
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
