import { db } from '../../core/db';
import type { Table } from 'dexie';
import type { GlucoseUnit } from '../../core/preferences';

export type { GlucoseUnit };
export type GlucoseContext = 'fasting' | 'before meal' | 'after meal' | 'bedtime' | 'random';

export const GLUCOSE_CONTEXTS: GlucoseContext[] = [
  'fasting',
  'before meal',
  'after meal',
  'bedtime',
  'random',
];

export interface GlucoseLog {
  id?: number;
  value: number;
  unit: GlucoseUnit;
  context: GlucoseContext;
  recordedAt: number;
  dayKey: string;
  note?: string;
}

export const glucoseSchema: Record<string, string> = {
  glucoseLogs: '++id, dayKey, recordedAt',
};

export const glucoseLogsTable = (): Table<GlucoseLog, number> =>
  db.t<GlucoseLog>('glucoseLogs');

/** Convert any glucose value to mg/dL for threshold comparisons. */
export function toMgDl(value: number, unit: GlucoseUnit): number {
  return unit === 'mmol/L' ? Math.round(value * 18.018) : value;
}

/** Format a glucose value with its unit label. */
export function fmtGlucose(value: number, unit: GlucoseUnit): string {
  return unit === 'mmol/L'
    ? `${value.toFixed(1)} mmol/L`
    : `${Math.round(value)} mg/dL`;
}
