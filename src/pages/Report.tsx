import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionHeader, StatTile } from '../components/ui';
import { ClipboardIcon } from '../components/icons';
import { dayKey, lastNDayKeys } from '../core/dates';
import { mean } from '../core/insights';
import { format, parseISO } from 'date-fns';

import { medicationsTable, medLogsTable } from '../modules/medications/db';
import { buildDayDoses, dayAdherence } from '../modules/medications/schedule';
import { supplementsTable, supplementLogsTable } from '../modules/supplements/db';
import { buildDayDoses as buildSuppDoses, dayAdherence as suppAdherence } from '../modules/supplements/schedule';
import { symptomsTable } from '../modules/symptoms/db';
import { glucoseLogsTable, toMgDl } from '../modules/glucose/db';
import { bpLogsTable } from '../modules/bloodpressure/db';
import { weightLogsTable, fmtWeight, toKg } from '../modules/weight/db';
import { exerciseLogsTable } from '../modules/exercise/db';

type Period = 7 | 30;

export function Report() {
  const [period, setPeriod] = useState<Period>(7);
  const today = dayKey();

  const data = useLiveQuery(async () => {
    const keys = lastNDayKeys(period);

    const [meds, medLogs, supps, suppLogs, symptoms, glucoseLogs, bpLogs, weightLogs, exerciseLogs] =
      await Promise.all([
        medicationsTable().toArray().then((all) => all.filter((m) => !m.archived)),
        medLogsTable().where('dayKey').anyOf(keys).toArray(),
        supplementsTable().toArray().then((all) => all.filter((s) => !s.archived)),
        supplementLogsTable().where('dayKey').anyOf(keys).toArray(),
        symptomsTable().where('dayKey').anyOf(keys).toArray(),
        glucoseLogsTable().where('dayKey').anyOf(keys).toArray(),
        bpLogsTable().where('dayKey').anyOf(keys).toArray(),
        weightLogsTable().where('dayKey').anyOf(keys).toArray(),
        exerciseLogsTable().where('dayKey').anyOf(keys).toArray(),
      ]);

    // Medication adherence
    const medLogsByDay = new Map<string, typeof medLogs>();
    for (const l of medLogs) {
      const arr = medLogsByDay.get(l.dayKey) ?? [];
      arr.push(l);
      medLogsByDay.set(l.dayKey, arr);
    }
    let medDue = 0, medTaken = 0;
    for (const k of keys) {
      const doses = buildDayDoses(meds, medLogsByDay.get(k) ?? [], k);
      const a = dayAdherence(doses);
      medDue += a.due;
      medTaken += a.taken;
    }
    const medPct = medDue > 0 ? Math.round((medTaken / medDue) * 100) : null;

    // Supplement adherence
    const suppLogsByDay = new Map<string, typeof suppLogs>();
    for (const l of suppLogs) {
      const arr = suppLogsByDay.get(l.dayKey) ?? [];
      arr.push(l);
      suppLogsByDay.set(l.dayKey, arr);
    }
    let suppDue = 0, suppTaken = 0;
    for (const k of keys) {
      const doses = buildSuppDoses(supps, suppLogsByDay.get(k) ?? [], k);
      const a = suppAdherence(doses);
      suppDue += a.due;
      suppTaken += a.taken;
    }
    const suppPct = suppDue > 0 ? Math.round((suppTaken / suppDue) * 100) : null;

    // Symptoms summary
    const symptomCount = symptoms.length;
    const avgSeverity = symptomCount > 0 ? mean(symptoms.map((s) => s.severity)) : null;
    const symptomTypes = [...new Set(symptoms.map((s) => s.type))];
    const mostCommon = symptomTypes
      .map((t) => ({ type: t, count: symptoms.filter((s) => s.type === t).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Glucose summary
    const glucoseMgdl = glucoseLogs.map((l) => toMgDl(l.value, l.unit));
    const glucoseAvg = glucoseMgdl.length > 0 ? Math.round(mean(glucoseMgdl)) : null;
    const glucoseMin = glucoseMgdl.length > 0 ? Math.min(...glucoseMgdl) : null;
    const glucoseMax = glucoseMgdl.length > 0 ? Math.max(...glucoseMgdl) : null;

    // BP summary
    const sysValues = bpLogs.map((l) => l.systolic);
    const diaValues = bpLogs.map((l) => l.diastolic);
    const bpAvg =
      sysValues.length > 0
        ? { sys: Math.round(mean(sysValues)), dia: Math.round(mean(diaValues)) }
        : null;

    // Weight change
    const weightsSorted = [...weightLogs].sort((a, b) => a.recordedAt - b.recordedAt);
    const weightChange =
      weightsSorted.length >= 2
        ? toKg(weightsSorted[weightsSorted.length - 1].value, weightsSorted[weightsSorted.length - 1].unit) -
          toKg(weightsSorted[0].value, weightsSorted[0].unit)
        : null;
    const latestWeight = weightsSorted[weightsSorted.length - 1];

    // Exercise
    const exerciseMin = exerciseLogs.reduce((s, l) => s + l.duration, 0);
    const exerciseSessions = exerciseLogs.length;

    return {
      medPct, medDue, medTaken,
      suppPct, suppDue, suppTaken,
      symptomCount, avgSeverity, mostCommon,
      glucoseAvg, glucoseMin, glucoseMax, glucoseCount: glucoseLogs.length,
      bpAvg, bpCount: bpLogs.length,
      weightChange, latestWeight,
      exerciseMin, exerciseSessions,
      keys,
    };
  }, [period, today]);

  const fromDate = data ? format(parseISO(data.keys[0]), 'MMM d') : '';
  const toDate = data ? format(parseISO(data.keys[data.keys.length - 1]), 'MMM d, yyyy') : '';

  return (
    <div>
      <PageHeader title="Health Report" back />

      <div className="mb-5 flex gap-2">
        {([7, 30] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition ${
              period === p ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Last {p} days
          </button>
        ))}
      </div>

      {data && (
        <div className="space-y-1">
          <p className="mb-4 text-sm text-slate-500 text-center">
            {fromDate} – {toDate}
          </p>

          {/* Medication adherence */}
          {data.medPct !== null && (
            <section className="mb-5">
              <SectionHeader title="Medication Adherence" />
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{data.medPct}%</p>
                    <p className="text-sm text-slate-500">
                      {data.medTaken} of {data.medDue} doses taken
                    </p>
                  </div>
                  <AdherenceRing pct={data.medPct} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {data.medPct >= 90
                    ? '✓ Excellent — above 90%'
                    : data.medPct >= 70
                      ? '· Good — a little room to improve'
                      : '⚠ Below target — aim for 80%+'}
                </p>
              </Card>
            </section>
          )}

          {/* Supplement adherence */}
          {data.suppPct !== null && (
            <section className="mb-5">
              <SectionHeader title="Supplement Adherence" />
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{data.suppPct}%</p>
                    <p className="text-sm text-slate-500">
                      {data.suppTaken} of {data.suppDue} doses taken
                    </p>
                  </div>
                  <AdherenceRing pct={data.suppPct} />
                </div>
              </Card>
            </section>
          )}

          {/* Symptoms */}
          {data.symptomCount > 0 && (
            <section className="mb-5">
              <SectionHeader title="Symptoms" />
              <Card className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label="Entries" value={data.symptomCount} />
                  <StatTile
                    label="Avg severity"
                    value={data.avgSeverity !== null ? `${data.avgSeverity.toFixed(1)}/10` : '—'}
                  />
                </div>
                {data.mostCommon.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Most logged</p>
                    {data.mostCommon.map((s) => (
                      <div key={s.type} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                        <span className="text-slate-700">{s.type}</span>
                        <span className="text-slate-500">{s.count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* Glucose */}
          {data.glucoseCount > 0 && (
            <section className="mb-5">
              <SectionHeader title="Blood Glucose" />
              <div className="grid grid-cols-3 gap-3">
                <StatTile label="Avg" value={`${data.glucoseAvg} mg/dL`} />
                <StatTile label="Low" value={`${data.glucoseMin}`} />
                <StatTile label="High" value={`${data.glucoseMax}`} />
              </div>
            </section>
          )}

          {/* BP */}
          {data.bpCount > 0 && data.bpAvg && (
            <section className="mb-5">
              <SectionHeader title="Blood Pressure" />
              <Card>
                <p className="text-2xl font-bold text-slate-800">
                  {data.bpAvg.sys}/{data.bpAvg.dia} mmHg
                </p>
                <p className="text-sm text-slate-500">Average over {data.bpCount} readings</p>
              </Card>
            </section>
          )}

          {/* Weight */}
          {data.latestWeight && (
            <section className="mb-5">
              <SectionHeader title="Weight" />
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {fmtWeight(data.latestWeight.value, data.latestWeight.unit)}
                    </p>
                    <p className="text-sm text-slate-500">Most recent reading</p>
                  </div>
                  {data.weightChange !== null && (
                    <span className={`text-sm font-semibold ${data.weightChange > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {data.weightChange > 0 ? '+' : ''}{data.weightChange.toFixed(1)} kg
                    </span>
                  )}
                </div>
              </Card>
            </section>
          )}

          {/* Exercise */}
          {data.exerciseSessions > 0 && (
            <section className="mb-5">
              <SectionHeader title="Exercise" />
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Total" value={`${data.exerciseMin} min`} />
                <StatTile label="Sessions" value={data.exerciseSessions} hint={`${Math.round(data.exerciseMin / period)} min/day avg`} />
              </div>
            </section>
          )}

          {data.medPct === null && data.symptomCount === 0 && data.glucoseCount === 0 && data.bpCount === 0 && !data.latestWeight && data.exerciseSessions === 0 && (
            <div className="flex flex-col items-center py-10 text-center text-slate-500">
              <ClipboardIcon className="mb-3 !h-10 !w-10 text-slate-300" />
              <p className="font-semibold">No data for this period yet</p>
              <p className="mt-1 text-sm">Start logging to see your health summary here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdherenceRing({ pct }: { pct: number }) {
  const size = 64;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const val = Math.max(0, Math.min(1, pct / 100));
  const color = pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c * (1 - val)}
        strokeLinecap="round"
      />
    </svg>
  );
}
