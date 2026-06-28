import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { exerciseLogsTable, EXERCISE_TYPES } from './db';
import { dayKey, lastNDayKeys } from '../../core/dates';
import { Card, AccentBadge } from '../../components/ui';
import { DumbbellIcon, ChevronRightIcon } from '../../components/icons';

export function ExerciseWidget() {
  const today = dayKey();
  const data = useLiveQuery(async () => {
    const weekKeys = lastNDayKeys(7);
    const weekLogs = await exerciseLogsTable().where('dayKey').anyOf(weekKeys).toArray();
    const todayLogs = weekLogs.filter((l) => l.dayKey === today);
    const weekMin = weekLogs.reduce((s, l) => s + l.duration, 0);
    return { todayLogs, weekMin };
  }, [today]);

  const todayMin = data?.todayLogs.reduce((s, l) => s + l.duration, 0) ?? 0;
  const weekMin = data?.weekMin ?? 0;
  const typeInfo = data?.todayLogs[0]
    ? EXERCISE_TYPES.find((t) => t.value === data.todayLogs[0].type)
    : null;

  return (
    <Link to="/m/exercise" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="amber">
            <DumbbellIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Exercise</p>
            {todayMin > 0 ? (
              <p className="text-sm text-emerald-600">
                {typeInfo?.emoji} {todayMin} min today · {weekMin} min this week
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {weekMin > 0 ? `${weekMin} min this week — log today's activity` : 'No activity yet — tap to log'}
              </p>
            )}
          </div>
          <ChevronRightIcon className="text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
