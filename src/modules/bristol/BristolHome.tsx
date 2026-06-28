import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { bristolLogsTable, BRISTOL_TYPES, bristolCategoryColor } from './db';
import { lastNDayKeys, friendlyDay, friendlyTime } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card, EmptyState } from '../../components/ui';
import { LeafIcon, PlusIcon } from '../../components/icons';
import { format, parseISO } from 'date-fns';

export function BristolHome() {
  const logs = useLiveQuery(
    () => bristolLogsTable().orderBy('recordedAt').reverse().toArray(),
    [],
  );

  if (!logs) return null;

  const chartData = buildChartData(logs);

  return (
    <div>
      <PageHeader
        title="Bowel Health"
        subtitle="Bristol Stool Scale log"
        action={
          <Link to="/m/bristol/log" aria-label="Log entry" className="btn-primary !px-3 !py-2">
            <PlusIcon />
          </Link>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={<LeafIcon />}
          title="No entries yet"
          body="Log bowel movements using the Bristol Stool Scale to help your doctor understand your digestive health."
          action={
            <Link to="/m/bristol/log" className="btn-primary">
              <PlusIcon className="!h-5 !w-5" /> Log entry
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {chartData.some((d) => d.count > 0) && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-slate-700">Frequency (14 days)</p>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Entries']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.count > 0 ? '#f43f5e' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <section>
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Recent entries</p>
            <ul className="space-y-3">
              {logs.slice(0, 30).map((log) => {
                const typeInfo = BRISTOL_TYPES.find((t) => t.type === log.type)!;
                return (
                  <li key={log.id}>
                    <Card className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">{typeInfo.label}</p>
                        <p className="text-sm text-slate-500">
                          {typeInfo.description} · {friendlyDay(log.recordedAt)} {friendlyTime(log.recordedAt)}
                          {log.note ? ` · ${log.note}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${bristolCategoryColor(typeInfo.category)}`}>
                        {typeInfo.category === 'constipation' ? 'Constipation' : typeInfo.category === 'normal' ? 'Normal' : 'Loose'}
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

function buildChartData(logs: { dayKey: string }[]) {
  const keys = lastNDayKeys(14);
  const byDay = new Map<string, number>();
  for (const log of logs) {
    byDay.set(log.dayKey, (byDay.get(log.dayKey) ?? 0) + 1);
  }
  return keys.map((k) => ({
    label: format(parseISO(k), 'd/M'),
    count: byDay.get(k) ?? 0,
  }));
}
