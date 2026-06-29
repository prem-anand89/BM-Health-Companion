import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { weightLogsTable, fmtWeight, toKg, calcBMI, bmiCategory, calcWHtR, whtRCategory } from './db';
import { getPreferences } from '../../core/preferences';
import { lastNDayKeys, friendlyDay } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState, StatTile } from '../../components/ui';
import { ScaleIcon, PlusIcon } from '../../components/icons';
import { format, parseISO } from 'date-fns';

export function WeightHome() {
  const prefs = getPreferences();
  const logs = useLiveQuery(
    () => weightLogsTable().orderBy('recordedAt').reverse().toArray(),
    [],
  );

  if (!logs) return null;

  const latest = logs[0];
  const latestKg = latest ? toKg(latest.value, latest.unit) : null;
  const bmi = latestKg && prefs.heightCm ? calcBMI(latestKg, prefs.heightCm) : null;
  const whtr =
    latest?.waistCm && prefs.heightCm
      ? calcWHtR(latest.waistCm, prefs.heightCm)
      : null;

  // Change vs earliest in window
  const windowKg = logs.slice(0, 30).map((l) => toKg(l.value, l.unit));
  const earliest = windowKg[windowKg.length - 1];
  const change = latestKg != null && earliest != null ? latestKg - earliest : null;

  const chartData = buildChartData(logs);

  return (
    <div>
      <PageHeader
        title="Weight"
        subtitle="Track your body weight over time"
        action={
          <Link to="/m/weight/log" aria-label="Log weight" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={<ScaleIcon />}
          title="No weight logged yet"
          body="Log your weight regularly to track changes and trends."
          action={
            <Link to="/m/weight/log" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Log weight
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Current"
              value={latest ? fmtWeight(latest.value, latest.unit) : '—'}
              hint={change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(1)} kg vs earliest` : undefined}
            />
            {bmi ? (
              <StatTile
                label="BMI"
                value={bmi.toFixed(1)}
                hint={bmiCategory(bmi)}
              />
            ) : (
              <StatTile label="Entries" value={logs.length} />
            )}
          </div>
          {whtr !== null && (
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Waist-to-Height"
                value={whtr.toFixed(2)}
                hint={whtRCategory(whtr)}
              />
              {latest?.waistCm && (
                <StatTile label="Waist" value={`${latest.waistCm} cm`} />
              )}
            </div>
          )}

          {chartData.some((d) => d.value !== null) && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Weight trend ({prefs.weightUnit})
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v: number) => [`${v} ${prefs.weightUnit}`, 'Weight']} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <section>
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Recent entries</p>
            <ul className="space-y-3">
              {logs.slice(0, 20).map((log) => (
                <li key={log.id}>
                  <Card className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{fmtWeight(log.value, log.unit)}</p>
                      {log.waistCm && (
                        <p className="text-xs text-slate-500">Waist: {log.waistCm} cm</p>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{friendlyDay(log.recordedAt)}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function buildChartData(logs: { dayKey: string; value: number }[]) {
  const keys = lastNDayKeys(30);
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
      value: avg !== null ? parseFloat(avg.toFixed(1)) : null,
    };
  });
}
