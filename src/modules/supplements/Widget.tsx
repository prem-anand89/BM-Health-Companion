import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { supplementsTable, supplementLogsTable } from './db';
import { buildDayDoses, dayAdherence } from './schedule';
import { dayKey } from '../../core/dates';
import { Card, ProgressRing, AccentBadge } from '../../components/ui';
import { FlaskIcon, ChevronRightIcon } from '../../components/icons';

export function SupplementsWidget() {
  const today = dayKey();
  const data = useLiveQuery(async () => {
    const supps = (await supplementsTable().toArray()).filter((s) => !s.archived);
    const logs = await supplementLogsTable().where('dayKey').equals(today).toArray();
    const doses = buildDayDoses(supps, logs, today);
    return { doses, hasSupps: supps.length > 0 };
  }, [today]);

  const doses = data?.doses ?? [];
  const { due, taken, ratio } = dayAdherence(doses);
  const nextPending = doses.find((d) => d.status === 'pending');

  return (
    <Link to="/m/supplements" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="amber">
            <FlaskIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Supplements</p>
            {!data?.hasSupps ? (
              <p className="text-sm text-slate-500">Tap to add your first supplement</p>
            ) : due === 0 ? (
              <p className="text-sm text-slate-500">Nothing scheduled today</p>
            ) : nextPending ? (
              <p className="text-sm text-slate-500">
                Next: {nextPending.supp.name} at {nextPending.time}
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
