import { db } from '../../core/db';
import type { Table } from 'dexie';

export interface BPLog {
  id?: number;
  systolic: number;
  diastolic: number;
  pulse?: number;
  recordedAt: number;
  dayKey: string;
  note?: string;
}

export const bpSchema: Record<string, string> = {
  bpLogs: '++id, dayKey, recordedAt',
};

export const bpLogsTable = (): Table<BPLog, number> =>
  db.t<BPLog>('bpLogs');

export type BPCategory = 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis';

export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'high2';
  if (systolic >= 130 || diastolic >= 80) return 'high1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  return 'normal';
}

export function bpCategoryLabel(cat: BPCategory): string {
  switch (cat) {
    case 'normal':   return 'Normal';
    case 'elevated': return 'Elevated';
    case 'high1':    return 'High — Stage 1';
    case 'high2':    return 'High — Stage 2';
    case 'crisis':   return 'Crisis — seek help now';
  }
}

export function bpCategoryColor(cat: BPCategory): string {
  switch (cat) {
    case 'normal':   return 'text-emerald-600';
    case 'elevated': return 'text-amber-600';
    case 'high1':    return 'text-orange-600';
    case 'high2':    return 'text-rose-600';
    case 'crisis':   return 'text-rose-700 font-bold';
  }
}
