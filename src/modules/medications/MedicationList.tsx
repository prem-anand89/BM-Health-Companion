import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { medicationsTable } from './db';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { PillIcon, PlusIcon, ChevronRightIcon } from '../../components/icons';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Manage the full list of active medications. */
export function MedicationList() {
  const meds = useLiveQuery(
    async () =>
      (await medicationsTable().toArray())
        .filter((m) => !m.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const archivedCount = useLiveQuery(
    async () => (await medicationsTable().toArray()).filter((m) => m.archived).length,
    [],
  );

  return (
    <div>
      <PageHeader
        title="All medications"
        back
        action={
          <Link to="/m/medications/new" aria-label="Add" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {!meds ? null : meds.length === 0 ? (
        <EmptyState
          icon={<PillIcon />}
          title="No medications"
          action={
            <Link to="/m/medications/new" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Add medication
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {meds.map((m) => (
            <li key={m.id}>
              <Link to={`/m/medications/${m.id}/edit`} className="block">
                <Card className="flex items-center gap-3 active:scale-[0.99] transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      {m.name} <span className="text-slate-400">·</span>{' '}
                      <span className="font-normal text-slate-500">{m.dose}</span>
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {m.times.join(', ')} ·{' '}
                      {m.daysOfWeek.length === 0
                        ? 'every day'
                        : m.daysOfWeek.map((d) => DAY_LABELS[d]).join(' ')}
                    </p>
                  </div>
                  <ChevronRightIcon className="text-slate-300" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!!archivedCount && (
        <Link
          to="/m/medications/archived"
          className="mt-6 block text-center text-sm font-semibold text-slate-500"
        >
          Archived ({archivedCount})
        </Link>
      )}
    </div>
  );
}
