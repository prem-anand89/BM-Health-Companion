import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { supplementsTable, supplementLogsTable, type SupplementStatus } from './db';
import { buildDayDoses, dayAdherence, type SupplementDose } from './schedule';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState, ProgressRing, StatTile } from '../../components/ui';
import { FlaskIcon, PlusIcon, CheckIcon } from '../../components/icons';

export function SupplementsHome() {
  const today = dayKey();

  const data = useLiveQuery(async () => {
    const supps = (await supplementsTable().toArray()).filter((s) => !s.archived);
    const logs = await supplementLogsTable().where('dayKey').equals(today).toArray();
    return { supps, doses: buildDayDoses(supps, logs, today) };
  }, [today]);

  const supps = data?.supps ?? [];
  const doses = data?.doses ?? [];
  const { due, taken, ratio } = dayAdherence(doses);

  async function record(dose: SupplementDose, status: SupplementStatus) {
    const existing = await supplementLogsTable()
      .where('[suppId+dayKey]')
      .equals([dose.supp.id!, today])
      .filter((l) => l.time === dose.time)
      .first();

    if (existing) {
      if (existing.status === status) {
        await supplementLogsTable().delete(existing.id!);
        return;
      }
      await supplementLogsTable().update(existing.id!, { status, recordedAt: Date.now() });
    } else {
      await supplementLogsTable().add({
        suppId: dose.supp.id!,
        dayKey: today,
        time: dose.time,
        status,
        recordedAt: Date.now(),
      });
    }

    if (status === 'stopped') {
      await supplementsTable().update(dose.supp.id!, { archived: true });
    }
  }

  return (
    <div>
      <PageHeader
        title="Supplements"
        subtitle="Today's schedule"
        action={
          <Link to="/m/supplements/new" aria-label="Add supplement" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {supps.length === 0 ? (
        <EmptyState
          icon={<FlaskIcon />}
          title="No supplements yet"
          body="Add vitamins, minerals or other supplements. Your companion will remind you and track your intake."
          action={
            <Link to="/m/supplements/new" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Add supplement
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {due > 0 && (
            <Card className="flex items-center gap-4">
              <ProgressRing value={ratio} size={72} label={`${taken}/${due}`} />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <StatTile label="Taken" value={taken} />
                <StatTile label="Remaining" value={due - taken} />
              </div>
            </Card>
          )}

          {due === 0 ? (
            <EmptyState title="Nothing scheduled today" body="Enjoy your day!" />
          ) : (
            <ul className="space-y-3">
              {doses.map((dose) => (
                <SupplementRow
                  key={`${dose.supp.id}-${dose.time}`}
                  dose={dose}
                  onRecord={record}
                />
              ))}
            </ul>
          )}

          <Link
            to="/m/supplements/list"
            className="block text-center text-sm font-semibold text-brand-700"
          >
            Manage all supplements
          </Link>
        </div>
      )}
    </div>
  );
}

function SupplementRow({
  dose,
  onRecord,
}: {
  dose: SupplementDose;
  onRecord: (d: SupplementDose, s: SupplementStatus) => void;
}) {
  const taken = dose.status === 'taken';
  const skipped = dose.status === 'skipped';
  const stopped = dose.status === 'stopped';

  return (
    <li>
      <Card className={`space-y-3 ${stopped ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-14 shrink-0 text-center">
            <p className="text-sm font-bold text-slate-700">{dose.time}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-slate-800 ${taken || stopped ? 'line-through' : ''}`}>
              {dose.supp.name}
            </p>
            <p className="truncate text-sm text-slate-500">
              {dose.supp.dose} · {dose.supp.form}
              {skipped && ' · skipped'}
              {stopped && ' · stopped'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            aria-label={taken ? 'Undo taken' : 'Mark taken'}
            onClick={() => onRecord(dose, 'taken')}
            className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold transition ${
              taken
                ? 'bg-brand-600 text-white'
                : 'bg-brand-50 text-brand-700 active:scale-95'
            }`}
          >
            <CheckIcon className="!h-4 !w-4" /> Taken
          </button>
          <button
            aria-label={skipped ? 'Undo skip' : 'Skip dose'}
            onClick={() => onRecord(dose, 'skipped')}
            className={`flex h-11 flex-1 items-center justify-center rounded-2xl text-sm font-semibold transition ${
              skipped
                ? 'bg-slate-400 text-white'
                : 'bg-slate-100 text-slate-500 active:scale-95'
            }`}
          >
            Skip
          </button>
          <button
            aria-label={stopped ? 'Supplement stopped' : 'Stop this supplement'}
            onClick={() => onRecord(dose, 'stopped')}
            className={`flex h-11 flex-1 items-center justify-center rounded-2xl text-sm font-semibold transition ${
              stopped
                ? 'bg-rose-500 text-white'
                : 'bg-rose-50 text-rose-600 active:scale-95'
            }`}
          >
            Stop
          </button>
        </div>
      </Card>
    </li>
  );
}
