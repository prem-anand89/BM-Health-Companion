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
import { symptomsTable, type Symptom } from './db';
import { lastNDayKeys, friendlyDay, friendlyTime } from '../../core/dates';
import { mean } from '../../core/insights';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { PulseIcon, PlusIcon } from '../../components/icons';
import { format, parseISO } from 'date-fns';

/** Symptoms home: 14-day severity trend + recent history + quick log. */
export function SymptomsHome() {
  const symptoms = useLiveQuery(
    async () => symptomsTable().orderBy('recordedAt').reverse().toArray(),
    [],
  );

  if (!symptoms) return null;

  const chartData = buildChartData(symptoms);

  return (
    <div>
      <PageHeader
        title="Symptoms"
        subtitle="Track how you feel over time"
        action={
          <Link to="/m/symptoms/log" aria-label="Log symptom" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {symptoms.length === 0 ? (
        <EmptyState
          icon={<PulseIcon />}
          title="No entries yet"
          body="Log how you feel when something comes up. Your coach will track trends and spot patterns."
          action={
            <Link to="/m/symptoms/log" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Log how you feel
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {chartData.some((d) => d.severity !== null) && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Average severity (14 days)
              </p>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 10]}
                      ticks={[0, 5, 10]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}/10`, 'Severity']}
                      labelStyle={{ color: '#0f172a' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="severity"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <section>
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Recent entries</p>
            <ul className="space-y-3">
              {symptoms.slice(0, 30).map((s) => (
                <li key={s.id}>
                  <Card className="flex items-center gap-3">
                    <SeverityDot value={s.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{s.type}</p>
                      <p className="truncate text-sm text-slate-500">
                        {friendlyDay(s.recordedAt)} · {friendlyTime(s.recordedAt)}
                        {s.note ? ` · ${s.note}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-600">
                      {s.severity}/10
                    </span>
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

function buildChartData(symptoms: Symptom[]) {
  const keys = lastNDayKeys(14);
  const byDay = new Map<string, number[]>();
  for (const s of symptoms) {
    const arr = byDay.get(s.dayKey) ?? [];
    arr.push(s.severity);
    byDay.set(s.dayKey, arr);
  }
  return keys.map((k) => {
    const vals = byDay.get(k);
    return {
      label: format(parseISO(k), 'd/M'),
      severity: vals && vals.length ? Number(mean(vals).toFixed(1)) : null,
    };
  });
}

function SeverityDot({ value }: { value: number }) {
  const color =
    value <= 3 ? 'bg-emerald-500' : value <= 6 ? 'bg-amber-500' : 'bg-rose-500';
  return <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />;
}
