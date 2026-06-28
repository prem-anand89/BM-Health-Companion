import { db } from '../../core/db';
import type { Table } from 'dexie';
import type { WeightUnit } from '../../core/preferences';

export type { WeightUnit };

export interface WeightLog {
  id?: number;
  value: number;
  unit: WeightUnit;
  recordedAt: number;
  dayKey: string;
}

export const weightSchema: Record<string, string> = {
  weightLogs: '++id, dayKey, recordedAt',
};

export const weightLogsTable = (): Table<WeightLog, number> =>
  db.t<WeightLog>('weightLogs');

export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? value * 0.453592 : value;
}

export function fmtWeight(value: number, unit: WeightUnit): string {
  return unit === 'lbs' ? `${value.toFixed(1)} lbs` : `${value.toFixed(1)} kg`;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const hm = heightCm / 100;
  return weightKg / (hm * hm);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
