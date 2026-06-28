import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { supplementsTable } from './db';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { FlaskIcon, PlusIcon, ChevronRightIcon } from '../../components/icons';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SupplementList() {
  const supps = useLiveQuery(
    async () =>
      (await supplementsTable().toArray())
        .filter((s) => !s.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  return (
    <div>
      <PageHeader
        title="All supplements"
        back
        action={
          <Link to="/m/supplements/new" aria-label="Add" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {!supps ? null : supps.length === 0 ? (
        <EmptyState
          icon={<FlaskIcon />}
          title="No supplements"
          action={
            <Link to="/m/supplements/new" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Add supplement
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {supps.map((s) => (
            <li key={s.id}>
              <Link to={`/m/supplements/${s.id}/edit`} className="block">
                <Card className="flex items-center gap-3 active:scale-[0.99] transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      {s.name} <span className="text-slate-400">·</span>{' '}
                      <span className="font-normal text-slate-500">{s.dose}</span>
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {s.times.join(', ')} ·{' '}
                      {s.daysOfWeek.length === 0
                        ? 'every day'
                        : s.daysOfWeek.map((d) => DAY_LABELS[d]).join(' ')}
                    </p>
                  </div>
                  <ChevronRightIcon className="text-slate-300" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
