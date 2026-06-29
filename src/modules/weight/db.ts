import { db } from '../../core/db';
import type { Table } from 'dexie';
import type { WeightUnit } from '../../core/preferences';

export type { WeightUnit };

export interface WeightLog {
  id?: number;
  value: number;
  unit: WeightUnit;
  /** Waist circumference in cm (always stored in cm regardless of unit preference). */
  waistCm?: number;
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

/** Waist-to-height ratio (dimensionless; both values in cm). */
export function calcWHtR(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

export function whtRCategory(ratio: number): string {
  if (ratio < 0.4) return 'Extremely slim';
  if (ratio < 0.5) return 'Healthy';
  if (ratio < 0.6) return 'Overweight';
  return 'High risk';
}

export function whtRColor(ratio: number): string {
  if (ratio < 0.5) return 'text-emerald-600';
  if (ratio < 0.6) return 'text-amber-600';
  return 'text-rose-600';
}
