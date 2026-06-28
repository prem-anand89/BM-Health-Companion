import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { PageHeader } from '../components/PageHeader';
import { Card, EmptyState, SectionHeader } from '../components/ui';
import { CalendarIcon } from '../components/icons';
import { dayKey, friendlyTime } from '../core/dates';

// Module-specific imports for cross-module history view
import { medicationsTable, medLogsTable } from '../modules/medications/db';
import { buildDayDoses } from '../modules/medications/schedule';
import { symptomsTable } from '../modules/symptoms/db';
import { supplementsTable, supplementLogsTable } from '../modules/supplements/db';
import { buildDayDoses as buildSuppDoses } from '../modules/supplements/schedule';
import { glucoseLogsTable, fmtGlucose } from '../modules/glucose/db';
import { bpLogsTable, classifyBP, bpCategoryLabel } from '../modules/bloodpressure/db';
import { weightLogsTable, fmtWeight } from '../modules/weight/db';
import { bristolLogsTable, BRISTOL_TYPES } from '../modules/bristol/db';
import { exerciseLogsTable, EXERCISE_TYPES } from '../modules/exercise/db';

export function History() {
  const [selectedDay, setSelectedDay] = useState<string>(dayKey());

  const data = useLiveQuery(async () => {
    const [meds, medLogs, symptoms, supps, suppLogs, glucoseLogs, bpLogs, weightLogs, bristolLogs, exerciseLogs] =
      await Promise.all([
        medicationsTable().toArray().then((all) => all.filter((m) => !m.archived)),
        medLogsTable().where('dayKey').equals(selectedDay).toArray(),
        symptomsTable().where('dayKey').equals(selectedDay).toArray(),
        supplementsTable().toArray().then((all) => all.filter((s) => !s.archived)),
        supplementLogsTable().where('dayKey').equals(selectedDay).toArray(),
        glucoseLogsTable().where('dayKey').equals(selectedDay).toArray(),
        bpLogsTable().where('dayKey').equals(selectedDay).toArray(),
        weightLogsTable().where('dayKey').equals(selectedDay).toArray(),
        bristolLogsTable().where('dayKey').equals(selectedDay).toArray(),
        exerciseLogsTable().where('dayKey').equals(selectedDay).toArray(),
      ]);

    const medDoses = buildDayDoses(meds, medLogs, selectedDay);
    const suppDoses = buildSuppDoses(supps, suppLogs, selectedDay);

    return { medDoses, symptoms, suppDoses, glucoseLogs, bpLogs, weightLogs, bristolLogs, exerciseLogs };
  }, [selectedDay]);

  const hasAnyData =
    data &&
    (data.medDoses.length > 0 ||
      data.symptoms.length > 0 ||
      data.suppDoses.length > 0 ||
      data.glucoseLogs.length > 0 ||
      data.bpLogs.length > 0 ||
      data.weightLogs.length > 0 ||
      data.bristolLogs.length > 0 ||
      data.exerciseLogs.length > 0);

  return (
    <div>
      <PageHeader title="History" subtitle="View any day's health log" back />

      <div className="mb-5">
        <label className="field-label">Select date</label>
        <input
          type="date"
          className="field-input"
          value={selectedDay}
          max={dayKey()}
          onChange={(e) => setSelectedDay(e.target.value)}
        />
      </div>

      <p className="mb-4 text-base font-bold text-slate-700">
        {format(parseISO(selectedDay), 'EEEE, MMMM d, yyyy')}
      </p>

      {!data ? null : !hasAnyData ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="Nothing logged this day"
          body="Select a different date, or start logging your health data to see it here."
        />
      ) : (
        <div className="space-y-6">
          {/* Medications */}
          {data.medDoses.length > 0 && (
            <section>
              <SectionHeader title="Medications" />
              <ul className="space-y-2">
                {data.medDoses.map((dose) => (
                  <li key={`${dose.med.id}-${dose.time}`}>
                    <Card className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{dose.med.name}</p>
                        <p className="text-sm text-slate-500">{dose.med.dose} · {dose.time}</p>
                      </div>
                      <StatusBadge status={dose.status} />
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Supplements */}
          {data.suppDoses.length > 0 && (
            <section>
              <SectionHeader title="Supplements" />
              <ul className="space-y-2">
                {data.suppDoses.map((dose) => (
                  <li key={`${dose.supp.id}-${dose.time}`}>
                    <Card className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{dose.supp.name}</p>
                        <p className="text-sm text-slate-500">{dose.supp.dose} · {dose.time}</p>
                      </div>
                      <StatusBadge status={dose.status} />
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Symptoms */}
          {data.symptoms.length > 0 && (
            <section>
              <SectionHeader title="Symptoms" />
              <ul className="space-y-2">
                {data.symptoms.map((s) => (
                  <li key={s.id}>
                    <Card className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{s.type}</p>
                        <p className="text-sm text-slate-500">
                          {friendlyTime(s.recordedAt)}{s.note ? ` · ${s.note}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-600">{s.severity}/10</span>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Blood Glucose */}
          {data.glucoseLogs.length > 0 && (
            <section>
              <SectionHeader title="Blood Glucose" />
              <ul className="space-y-2">
                {data.glucoseLogs.map((log) => (
                  <li key={log.id}>
                    <Card className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{fmtGlucose(log.value, log.unit)}</p>
                      <p className="text-sm text-slate-500">{log.context} · {friendlyTime(log.recordedAt)}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Blood Pressure */}
          {data.bpLogs.length > 0 && (
            <section>
              <SectionHeader title="Blood Pressure" />
              <ul className="space-y-2">
                {data.bpLogs.map((log) => (
                  <li key={log.id}>
                    <Card className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{log.systolic}/{log.diastolic} mmHg</p>
                      <p className="text-sm text-slate-500">
                        {bpCategoryLabel(classifyBP(log.systolic, log.diastolic))} · {friendlyTime(log.recordedAt)}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Weight */}
          {data.weightLogs.length > 0 && (
            <section>
              <SectionHeader title="Weight" />
              <ul className="space-y-2">
                {data.weightLogs.map((log) => (
                  <li key={log.id}>
                    <Card className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{fmtWeight(log.value, log.unit)}</p>
                      <p className="text-sm text-slate-500">{friendlyTime(log.recordedAt)}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Bristol */}
          {data.bristolLogs.length > 0 && (
            <section>
              <SectionHeader title="Bowel Health" />
              <ul className="space-y-2">
                {data.bristolLogs.map((log) => {
                  const info = BRISTOL_TYPES.find((t) => t.type === log.type)!;
                  return (
                    <li key={log.id}>
                      <Card className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{info.label}</p>
                          <p className="text-sm text-slate-500">{info.description}</p>
                        </div>
                        <p className="text-sm text-slate-500">{friendlyTime(log.recordedAt)}</p>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Exercise */}
          {data.exerciseLogs.length > 0 && (
            <section>
              <SectionHeader title="Exercise" />
              <ul className="space-y-2">
                {data.exerciseLogs.map((log) => {
                  const info = EXERCISE_TYPES.find((t) => t.value === log.type);
                  return (
                    <li key={log.id}>
                      <Card className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {info?.emoji} {info?.label ?? log.type} · {log.duration} min
                          </p>
                          <p className="text-sm text-slate-500 capitalize">{log.intensity}</p>
                        </div>
                        <p className="text-sm text-slate-500">{friendlyTime(log.recordedAt)}</p>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    taken: 'bg-emerald-100 text-emerald-700',
    skipped: 'bg-slate-100 text-slate-600',
    stopped: 'bg-rose-100 text-rose-700',
    pending: 'bg-slate-50 text-slate-400',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
