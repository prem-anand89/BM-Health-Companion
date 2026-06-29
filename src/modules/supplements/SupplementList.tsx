import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { supplementsTable, SUPPLEMENT_CATEGORIES, type SupplementCategory } from './db';
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
  const archivedCount = useLiveQuery(
    async () => (await supplementsTable().toArray()).filter((s) => s.archived).length,
    [],
  );

  if (!supps) return null;

  // Group by category; uncategorised falls under 'other'
  const groups = new Map<SupplementCategory, typeof supps>();
  for (const s of supps) {
    const cat: SupplementCategory = s.category ?? 'other';
    const arr = groups.get(cat) ?? [];
    arr.push(s);
    groups.set(cat, arr);
  }

  // Render probiotics first, then remaining categories in declared order
  const orderedKeys: SupplementCategory[] = ['probiotic', 'vitamin', 'mineral', 'omega', 'herb', 'other'];

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

      {supps.length === 0 ? (
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
        <div className="space-y-6">
          {orderedKeys.map((key) => {
            const list = groups.get(key);
            if (!list || list.length === 0) return null;
            const catInfo = SUPPLEMENT_CATEGORIES.find((c) => c.value === key)!;
            return (
              <section key={key}>
                <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-slate-600">
                  <span>{catInfo.emoji}</span> {catInfo.label}
                </p>
                <ul className="space-y-3">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link to={`/m/supplements/${s.id}/edit`} className="block">
                        <Card className="flex items-center gap-3 active:scale-[0.99] transition">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800">
                              {s.name}{' '}
                              <span className="font-normal text-slate-500">· {s.dose}</span>
                            </p>
                            <p className="truncate text-sm text-slate-500">
                              {s.times.join(', ')} ·{' '}
                              {s.daysOfWeek.length === 0
                                ? 'every day'
                                : s.daysOfWeek.map((d) => DAY_LABELS[d]).join(' ')}
                              {s.cfuBillions ? ` · ${s.cfuBillions}B CFU` : ''}
                            </p>
                            {s.strains && (
                              <p className="truncate text-xs text-slate-400">{s.strains}</p>
                            )}
                          </div>
                          <ChevronRightIcon className="text-slate-300" />
                        </Card>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {!!archivedCount && (
        <Link
          to="/m/supplements/archived"
          className="mt-6 block text-center text-sm font-semibold text-slate-500"
        >
          Archived ({archivedCount})
        </Link>
      )}
    </div>
  );
}
