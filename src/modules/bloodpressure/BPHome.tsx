import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { bpLogsTable, classifyBP, bpCategoryLabel, bpCategoryColor } from './db';
import { lastNDayKeys, friendlyDay, friendlyTime } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { HeartIcon, PlusIcon } from '../../components/icons';
import { format, parseISO } from 'date-fns';

export function BPHome() {
  const logs = useLiveQuery(
    () => bpLogsTable().orderBy('recordedAt').reverse().toArray(),
    [],
  );

  if (!logs) return null;

  const chartData = buildChartData(logs);

  return (
    <div>
      <PageHeader
        title="Blood Pressure"
        subtitle="Track your readings over time"
        action={
          <Link to="/m/bloodpressure/log" aria-label="Log reading" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={<HeartIcon />}
          title="No readings yet"
          body="Log your blood pressure to track trends and detect patterns."
          action={
            <Link to="/m/bloodpressure/log" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Log reading
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {chartData.some((d) => d.systolic !== null) && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Systolic / Diastolic (mmHg)
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis domain={[40, 200]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip />
                    <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="3 3" />
                    <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="systolic" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} connectNulls name="Systolic" />
                    <Line type="monotone" dataKey="diastolic" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} connectNulls name="Diastolic" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-sky-400" />Systolic</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-indigo-400" />Diastolic</span>
              </div>
            </Card>
          )}

          <section>
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Recent entries</p>
            <ul className="space-y-3">
              {logs.slice(0, 30).map((log) => {
                const cat = classifyBP(log.systolic, log.diastolic);
                return (
                  <li key={log.id}>
                    <Card className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-lg">
                          {log.systolic}/{log.diastolic}
                          {log.pulse ? <span className="ml-2 text-sm font-normal text-slate-500">{log.pulse} bpm</span> : null}
                        </p>
                        <p className="text-sm text-slate-500">
                          {friendlyDay(log.recordedAt)} {friendlyTime(log.recordedAt)}
                          {log.note ? ` · ${log.note}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${bpCategoryColor(cat)}`}>
                        {bpCategoryLabel(cat)}
                      </span>
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

function buildChartData(logs: { dayKey: string; systolic: number; diastolic: number }[]) {
  const keys = lastNDayKeys(14);
  const byDay = new Map<string, { sys: number[]; dia: number[] }>();
  for (const log of logs) {
    const entry = byDay.get(log.dayKey) ?? { sys: [], dia: [] };
    entry.sys.push(log.systolic);
    entry.dia.push(log.diastolic);
    byDay.set(log.dayKey, entry);
  }
  return keys.map((k) => {
    const e = byDay.get(k);
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
    return {
      label: format(parseISO(k), 'd/M'),
      systolic: e ? avg(e.sys) : null,
      diastolic: e ? avg(e.dia) : null,
    };
  });
}
