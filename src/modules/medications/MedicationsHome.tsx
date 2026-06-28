import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { medicationsTable, medLogsTable, type DoseStatus } from './db';
import { buildDayDoses, dayAdherence, type DoseInstance } from './schedule';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState, ProgressRing, StatTile } from '../../components/ui';
import { PillIcon, PlusIcon, CheckIcon } from '../../components/icons';

/** The Medications "Today" screen: schedule for today with one-tap actions,
 *  plus a link to manage the full medication list. */
export function MedicationsHome() {
  const today = dayKey();

  const data = useLiveQuery(async () => {
    const meds = (await medicationsTable().toArray()).filter((m) => !m.archived);
    const logs = await medLogsTable().where('dayKey').equals(today).toArray();
    return { meds, doses: buildDayDoses(meds, logs, today) };
  }, [today]);

  const meds = data?.meds ?? [];
  const doses = data?.doses ?? [];
  const { due, taken, ratio } = dayAdherence(doses);

  async function record(dose: DoseInstance, status: DoseStatus) {
    const existing = await medLogsTable()
      .where('[medId+dayKey]')
      .equals([dose.med.id!, today])
      .filter((l) => l.time === dose.time)
      .first();

    if (existing) {
      // Toggle off if tapping the same status again.
      if (existing.status === status) {
        await medLogsTable().delete(existing.id!);
        return;
      }
      await medLogsTable().update(existing.id!, { status, recordedAt: Date.now() });
      return;
    }
    await medLogsTable().add({
      medId: dose.med.id!,
      dayKey: today,
      time: dose.time,
      status,
      recordedAt: Date.now(),
    });
  }

  return (
    <div>
      <PageHeader
        title="Medications"
        subtitle="Today's schedule"
        action={
          <Link to="/m/medications/new" aria-label="Add medication" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {meds.length === 0 ? (
        <EmptyState
          icon={<PillIcon />}
          title="No medications yet"
          body="Add a medication and its schedule. Your companion will remind you and track how you're doing."
          action={
            <Link to="/m/medications/new" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Add medication
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
                <DoseRow
                  key={`${dose.med.id}-${dose.time}`}
                  dose={dose}
                  onRecord={record}
                />
              ))}
            </ul>
          )}

          <Link
            to="/m/medications/list"
            className="block text-center text-sm font-semibold text-brand-700"
          >
            Manage all medications
          </Link>
        </div>
      )}
    </div>
  );
}

function DoseRow({
  dose,
  onRecord,
}: {
  dose: DoseInstance;
  onRecord: (d: DoseInstance, s: DoseStatus) => void;
}) {
  const taken = dose.status === 'taken';
  const skipped = dose.status === 'skipped';
  return (
    <li>
      <Card className={`flex items-center gap-3 ${taken ? 'opacity-70' : ''}`}>
        <div className="w-14 shrink-0 text-center">
          <p className="text-sm font-bold text-slate-700">{dose.time}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-slate-800 ${taken ? 'line-through' : ''}`}>
            {dose.med.name}
          </p>
          <p className="truncate text-sm text-slate-500">
            {dose.med.dose} · {dose.med.form}
            {skipped && ' · skipped'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={taken ? 'Undo taken' : 'Mark taken'}
            onClick={() => onRecord(dose, 'taken')}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
              taken
                ? 'bg-brand-600 text-white'
                : 'bg-brand-50 text-brand-700 active:scale-95'
            }`}
          >
            <CheckIcon />
          </button>
          <button
            aria-label={skipped ? 'Undo skip' : 'Skip dose'}
            onClick={() => onRecord(dose, 'skipped')}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold transition ${
              skipped
                ? 'bg-slate-400 text-white'
                : 'bg-slate-100 text-slate-500 active:scale-95'
            }`}
          >
            Skip
          </button>
        </div>
      </Card>
    </li>
  );
}
