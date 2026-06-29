import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  medicationsTable,
  medLogsTable,
  type DoseStatus,
} from '../modules/medications/db';
import { buildDayDoses as buildMedDoses } from '../modules/medications/schedule';
import {
  supplementsTable,
  supplementLogsTable,
} from '../modules/supplements/db';
import { buildDayDoses as buildSuppDoses } from '../modules/supplements/schedule';
import { dayKey } from '../core/dates';
import { Card, ProgressRing } from './ui';
import { PillIcon, LeafIcon, CheckIcon, PlusIcon } from './icons';

type Kind = 'rx' | 'supp';
type Status = DoseStatus | 'pending';

/** One interleaved dose row, normalised across the two modules. */
interface PillDose {
  kind: Kind;
  itemId: number;
  name: string;
  detail: string;
  time: string;
  status: Status;
}

/**
 * Cross-module "things I take today" card for the Home dashboard: medications
 * and supplements interleaved by time, with the shared Taken / Skip / Stop row.
 * The two data models stay completely separate — each action writes to its own
 * log table — so adherence metrics are unaffected. (Plan items D + E.)
 */
export function TodaysPillsWidget() {
  const today = dayKey();

  const data = useLiveQuery(async () => {
    const [meds, supps, medLogs, suppLogs] = await Promise.all([
      medicationsTable().toArray(),
      supplementsTable().toArray(),
      medLogsTable().where('dayKey').equals(today).toArray(),
      supplementLogsTable().where('dayKey').equals(today).toArray(),
    ]);
    const activeMeds = meds.filter((m) => !m.archived);
    const activeSupps = supps.filter((s) => !s.archived);

    const medDoses: PillDose[] = buildMedDoses(activeMeds, medLogs, today).map((d) => ({
      kind: 'rx',
      itemId: d.med.id!,
      name: d.med.name,
      detail: `${d.med.dose} · ${d.med.form}`,
      time: d.time,
      status: d.status,
    }));
    const suppDoses: PillDose[] = buildSuppDoses(activeSupps, suppLogs, today).map((d) => ({
      kind: 'supp',
      itemId: d.supp.id!,
      name: d.supp.name,
      detail: `${d.supp.dose}${d.supp.cfuBillions ? ` · ${d.supp.cfuBillions}B CFU` : ''}`,
      time: d.time,
      status: d.status,
    }));

    const all = [...medDoses, ...suppDoses].sort((a, b) => a.time.localeCompare(b.time));
    return { all, hasItems: activeMeds.length + activeSupps.length > 0 };
  }, [today]);

  const doses = data?.all ?? [];
  const active = doses.filter((d) => d.status !== 'stopped');
  const due = active.length;
  const taken = active.filter((d) => d.status === 'taken').length;
  const ratio = due === 0 ? 1 : taken / due;

  async function record(dose: PillDose, status: DoseStatus) {
    if (dose.kind === 'rx') {
      const existing = await medLogsTable()
        .where('[medId+dayKey]')
        .equals([dose.itemId, today])
        .filter((l) => l.time === dose.time)
        .first();
      if (existing) {
        if (existing.status === status) {
          await medLogsTable().delete(existing.id!);
          return;
        }
        await medLogsTable().update(existing.id!, { status, recordedAt: Date.now() });
      } else {
        await medLogsTable().add({
          medId: dose.itemId,
          dayKey: today,
          time: dose.time,
          status,
          recordedAt: Date.now(),
        });
      }
      if (status === 'stopped') {
        await medicationsTable().update(dose.itemId, { archived: true });
      }
    } else {
      const existing = await supplementLogsTable()
        .where('[suppId+dayKey]')
        .equals([dose.itemId, today])
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
          suppId: dose.itemId,
          dayKey: today,
          time: dose.time,
          status,
          recordedAt: Date.now(),
        });
      }
      if (status === 'stopped') {
        await supplementsTable().update(dose.itemId, { archived: true });
      }
    }
  }

  if (!data) return null;

  if (!data.hasItems) {
    return (
      <Card className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <PillIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">Today's pills</p>
          <p className="text-sm text-slate-500">Add a medication or supplement to begin</p>
        </div>
        <Link to="/m/medications/new" aria-label="Add medication" className="btn-primary !px-3 !py-2">
          <PlusIcon />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={ratio} size={56} label={`${taken}/${due}`} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">Today's pills</p>
          <p className="text-sm text-slate-500">
            {due === 0
              ? 'Nothing scheduled today'
              : taken >= due
              ? 'All done for today 🎉'
              : `${due - taken} still to take`}
          </p>
        </div>
      </div>

      {due > 0 && (
        <ul className="space-y-3">
          {doses.map((dose) => (
            <PillRow key={`${dose.kind}-${dose.itemId}-${dose.time}`} dose={dose} onRecord={record} />
          ))}
        </ul>
      )}

      <div className="flex justify-between text-sm font-semibold text-brand-700">
        <Link to="/m/medications">Medications</Link>
        <Link to="/m/supplements">Supplements</Link>
      </div>
    </Card>
  );
}

function PillRow({
  dose,
  onRecord,
}: {
  dose: PillDose;
  onRecord: (d: PillDose, s: DoseStatus) => void;
}) {
  const taken = dose.status === 'taken';
  const skipped = dose.status === 'skipped';
  const stopped = dose.status === 'stopped';

  return (
    <li>
      <div className={`rounded-2xl bg-slate-50 p-3 space-y-3 ${stopped ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 shrink-0 text-center">
            <p className="text-sm font-bold text-slate-700">{dose.time}</p>
          </div>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold ${
              dose.kind === 'rx' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'
            }`}
            title={dose.kind === 'rx' ? 'Medication' : 'Supplement'}
          >
            {dose.kind === 'rx' ? 'Rx' : <LeafIcon className="!h-4 !w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-slate-800 ${taken || stopped ? 'line-through' : ''}`}>
              {dose.name}
            </p>
            <p className="truncate text-sm text-slate-500">
              {dose.detail}
              {skipped && ' · skipped'}
              {stopped && ' · stopped'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            aria-label={taken ? 'Undo taken' : 'Mark taken'}
            onClick={() => onRecord(dose, 'taken')}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
              taken ? 'bg-brand-600 text-white' : 'bg-white text-brand-700 active:scale-95'
            }`}
          >
            <CheckIcon className="!h-4 !w-4" /> Taken
          </button>
          <button
            aria-label={skipped ? 'Undo skip' : 'Skip dose'}
            onClick={() => onRecord(dose, 'skipped')}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition ${
              skipped ? 'bg-slate-400 text-white' : 'bg-white text-slate-500 active:scale-95'
            }`}
          >
            Skip
          </button>
          <button
            aria-label={stopped ? 'Stopped' : 'Stop this'}
            onClick={() => onRecord(dose, 'stopped')}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition ${
              stopped ? 'bg-rose-500 text-white' : 'bg-white text-rose-600 active:scale-95'
            }`}
          >
            Stop
          </button>
        </div>
      </div>
    </li>
  );
}
