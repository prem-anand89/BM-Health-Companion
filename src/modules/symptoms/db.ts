import { db } from '../../core/db';
import type { Table } from 'dexie';

export interface Symptom {
  id?: number;
  /** Free-text or preset symptom name, e.g. "Headache". */
  type: string;
  /** 0 (none) .. 10 (worst). */
  severity: number;
  /** When it occurred. */
  recordedAt: number;
  /** yyyy-MM-dd of recordedAt, for day grouping/trends. */
  dayKey: string;
  note?: string;
  tags?: string[];
}

export const symptomsSchema: Record<string, string> = {
  symptoms: '++id, type, dayKey, recordedAt',
};

export const symptomsTable = (): Table<Symptom, number> =>
  db.t<Symptom>('symptoms');

/** Common presets to minimise typing for less technical users. */
export const SYMPTOM_PRESETS = [
  'Headache',
  'Fatigue',
  'Nausea',
  'Pain',
  'Dizziness',
  'Cough',
  'Anxiety',
  'Poor sleep',
];
