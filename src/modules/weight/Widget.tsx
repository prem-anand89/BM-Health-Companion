import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { weightLogsTable, fmtWeight, toKg } from './db';
import { Card, AccentBadge } from '../../components/ui';
import { ScaleIcon, ChevronRightIcon } from '../../components/icons';

export function WeightWidget() {
  const logs = useLiveQuery(
    () => weightLogsTable().orderBy('recordedAt').reverse().limit(2).toArray(),
    [],
  );

  const latest = logs?.[0];
  const prev = logs?.[1];
  const changeKg =
    latest && prev
      ? toKg(latest.value, latest.unit) - toKg(prev.value, prev.unit)
      : null;

  return (
    <Link to="/m/weight" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="emerald">
            <ScaleIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Weight</p>
            {latest ? (
              <p className="text-sm text-slate-500">
                {fmtWeight(latest.value, latest.unit)}
                {changeKg !== null
                  ? ` · ${changeKg >= 0 ? '+' : ''}${changeKg.toFixed(1)} kg`
                  : ''}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No entries yet — tap to log</p>
            )}
          </div>
          <ChevronRightIcon className="text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
