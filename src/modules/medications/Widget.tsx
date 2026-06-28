import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { medicationsTable, medLogsTable } from './db';
import { buildDayDoses, dayAdherence } from './schedule';
import { dayKey } from '../../core/dates';
import { Card, ProgressRing, AccentBadge } from '../../components/ui';
import { PillIcon, ChevronRightIcon } from '../../components/icons';

/** Compact medications summary for the home dashboard: today's adherence ring
 *  and the next pending dose. */
export function MedicationsWidget() {
  const today = dayKey();
  const data = useLiveQuery(async () => {
    const meds = (await medicationsTable().toArray()).filter((m) => !m.archived);
    const logs = await medLogsTable().where('dayKey').equals(today).toArray();
    const doses = buildDayDoses(meds, logs, today);
    return { doses, hasMeds: meds.length > 0 };
  }, [today]);

  const doses = data?.doses ?? [];
  const { due, taken, ratio } = dayAdherence(doses);
  const nextPending = doses.find((d) => d.status === 'pending');

  return (
    <Link to="/m/medications" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="brand">
            <PillIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Medications</p>
            {!data?.hasMeds ? (
              <p className="text-sm text-slate-500">Tap to add your first medication</p>
            ) : due === 0 ? (
              <p className="text-sm text-slate-500">Nothing scheduled today</p>
            ) : nextPending ? (
              <p className="text-sm text-slate-500">
                Next: {nextPending.med.name} at {nextPending.time}
              </p>
            ) : (
              <p className="text-sm text-emerald-600">All done for today 🎉</p>
            )}
          </div>
          {due > 0 ? (
            <ProgressRing value={ratio} label={`${taken}/${due}`} />
          ) : (
            <ChevronRightIcon className="text-slate-300" />
          )}
        </div>
      </Card>
    </Link>
  );
}
