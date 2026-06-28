import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { symptomsTable } from './db';
import { lastNDayKeys, friendlyDay } from '../../core/dates';
import { mean } from '../../core/insights';
import { Card, AccentBadge } from '../../components/ui';
import { PulseIcon, ChevronRightIcon } from '../../components/icons';

/** Dashboard widget: last logged symptom + a 7-day severity sparkline. */
export function SymptomsWidget() {
  const data = useLiveQuery(async () => {
    const latest = await symptomsTable().orderBy('recordedAt').last();
    const keys = lastNDayKeys(7);
    const recent = await symptomsTable()
      .where('dayKey')
      .anyOf(keys)
      .toArray();
    const byDay = new Map<string, number[]>();
    for (const s of recent) {
      const arr = byDay.get(s.dayKey) ?? [];
      arr.push(s.severity);
      byDay.set(s.dayKey, arr);
    }
    const spark = keys.map((k) => ({
      v: byDay.has(k) ? Number(mean(byDay.get(k)!).toFixed(1)) : 0,
    }));
    return { latest, spark, hasData: recent.length > 0 };
  }, []);

  return (
    <Link to="/m/symptoms" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="rose">
            <PulseIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Symptoms</p>
            {!data?.latest ? (
              <p className="text-sm text-slate-500">Tap to log how you feel</p>
            ) : (
              <p className="truncate text-sm text-slate-500">
                Last: {data.latest.type} ({data.latest.severity}/10) ·{' '}
                {friendlyDay(data.latest.recordedAt)}
              </p>
            )}
          </div>
          {data?.hasData ? (
            <div className="h-10 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.spark}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChevronRightIcon className="text-slate-300" />
          )}
        </div>
      </Card>
    </Link>
  );
}
