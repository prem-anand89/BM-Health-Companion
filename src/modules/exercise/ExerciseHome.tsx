import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { exerciseLogsTable, EXERCISE_TYPES } from './db';
import { lastNDayKeys, friendlyDay, friendlyTime } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState, StatTile } from '../../components/ui';
import { DumbbellIcon, PlusIcon } from '../../components/icons';
import { format, parseISO } from 'date-fns';

export function ExerciseHome() {
  const logs = useLiveQuery(
    () => exerciseLogsTable().orderBy('recordedAt').reverse().toArray(),
    [],
  );

  if (!logs) return null;

  const weekKeys = lastNDayKeys(7);
  const weekLogs = logs.filter((l) => weekKeys.includes(l.dayKey));
  const weekMinutes = weekLogs.reduce((s, l) => s + l.duration, 0);
  const weekSessions = weekLogs.length;
  const chartData = buildChartData(logs);

  return (
    <div>
      <PageHeader
        title="Exercise"
        subtitle="Stay active, stay healthy"
        action={
          <Link to="/m/exercise/log" aria-label="Log exercise" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={<DumbbellIcon />}
          title="No activity logged yet"
          body="Log walks, runs, gym sessions and more to track your active minutes and build a healthy streak."
          action={
            <Link to="/m/exercise/log" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Log activity
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="This week"
              value={`${weekMinutes} min`}
              hint={`${weekSessions} session${weekSessions !== 1 ? 's' : ''}`}
            />
            <StatTile
              label="Goal"
              value={weekMinutes >= 150 ? '✓ Met' : `${150 - weekMinutes} min left`}
              hint="WHO: 150 min/week"
            />
          </div>

          {chartData.some((d) => d.minutes > 0) && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-slate-700">Active minutes (14 days)</p>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v: number) => [`${v} min`, 'Active']} />
                    <Bar dataKey="minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <section>
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Recent sessions</p>
            <ul className="space-y-3">
              {logs.slice(0, 20).map((log) => {
                const typeInfo = EXERCISE_TYPES.find((t) => t.value === log.type);
                return (
                  <li key={log.id}>
                    <Card className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo?.emoji ?? '⚡'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">
                          {typeInfo?.label ?? log.type} · {log.duration} min
                        </p>
                        <p className="text-sm text-slate-500 capitalize">
                          {log.intensity} · {friendlyDay(log.recordedAt)} {friendlyTime(log.recordedAt)}
                          {log.note ? ` · ${log.note}` : ''}
                        </p>
                      </div>
                      {log.steps && (
                        <span className="shrink-0 text-sm text-slate-400">{log.steps.toLocaleString()} steps</span>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function buildChartData(logs: { dayKey: string; duration: number }[]) {
  const keys = lastNDayKeys(14);
  const byDay = new Map<string, number>();
  for (const log of logs) {
    byDay.set(log.dayKey, (byDay.get(log.dayKey) ?? 0) + log.duration);
  }
  return keys.map((k) => ({
    label: format(parseISO(k), 'd/M'),
    minutes: byDay.get(k) ?? 0,
  }));
}
