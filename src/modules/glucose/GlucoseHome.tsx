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
import { glucoseLogsTable, fmtGlucose, toMgDl } from './db';
import { getPreferences } from '../../core/preferences';
import { lastNDayKeys, friendlyDay, friendlyTime } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { DropIcon, PlusIcon } from '../../components/icons';
import { format, parseISO } from 'date-fns';

export function GlucoseHome() {
  const prefs = getPreferences();
  const logs = useLiveQuery(
    () => glucoseLogsTable().orderBy('recordedAt').reverse().toArray(),
    [],
  );

  if (!logs) return null;

  const chartData = buildChartData(logs, prefs.glucoseUnit);
  const targetMinDisplay =
    prefs.glucoseUnit === 'mmol/L'
      ? parseFloat((prefs.glucoseTargetMin / 18.018).toFixed(1))
      : prefs.glucoseTargetMin;
  const targetMaxDisplay =
    prefs.glucoseUnit === 'mmol/L'
      ? parseFloat((prefs.glucoseTargetMax / 18.018).toFixed(1))
      : prefs.glucoseTargetMax;

  return (
    <div>
      <PageHeader
        title="Blood Glucose"
        subtitle="Track your readings over time"
        action={
          <Link to="/m/glucose/log" aria-label="Log reading" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={<DropIcon />}
          title="No readings yet"
          body="Log your blood glucose readings to track trends and stay in your target range."
          action={
            <div className="flex flex-col items-center gap-2">
              <Link to="/m/glucose/log" className="btn-primary">
                <PlusIcon className="!h-5 !w-5" /> Log reading
              </Link>
              <Link to="/import" className="text-sm font-semibold text-brand-700">
                Import a CGM report
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          {chartData.some((d) => d.value !== null) && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Recent readings ({prefs.glucoseUnit})
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v: number) => [`${v} ${prefs.glucoseUnit}`, 'Glucose']} />
                    <ReferenceLine y={targetMinDisplay} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Min', position: 'right', fontSize: 10, fill: '#10b981' }} />
                    <ReferenceLine y={targetMaxDisplay} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Max', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <section>
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Recent entries</p>
            <ul className="space-y-3">
              {logs.slice(0, 30).map((log) => {
                const mgdl = toMgDl(log.value, log.unit);
                const inRange = mgdl >= prefs.glucoseTargetMin && mgdl <= prefs.glucoseTargetMax;
                return (
                  <li key={log.id}>
                    <Card className="flex items-center gap-3">
                      <span className={`h-3 w-3 shrink-0 rounded-full ${inRange ? 'bg-emerald-500' : mgdl > prefs.glucoseTargetMax ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">{fmtGlucose(log.value, log.unit)}</p>
                        <p className="truncate text-sm text-slate-500">
                          {log.context} · {friendlyDay(log.recordedAt)} {friendlyTime(log.recordedAt)}
                          {log.note ? ` · ${log.note}` : ''}
                        </p>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>

          <Link to="/import" className="block text-center text-sm font-semibold text-brand-700">
            Import a CGM report
          </Link>
        </div>
      )}
    </div>
  );
}

function buildChartData(logs: import('./db').GlucoseLog[], unit: string) {
  const keys = lastNDayKeys(14);
  const byDay = new Map<string, number[]>();
  for (const log of logs) {
    const arr = byDay.get(log.dayKey) ?? [];
    arr.push(log.value);
    byDay.set(log.dayKey, arr);
  }
  return keys.map((k) => {
    const vals = byDay.get(k);
    const avg = vals && vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    return {
      label: format(parseISO(k), 'd/M'),
      value: avg !== null ? (unit === 'mmol/L' ? parseFloat(avg.toFixed(1)) : Math.round(avg)) : null,
    };
  });
}
