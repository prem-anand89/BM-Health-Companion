import { db } from '../../core/db';
import type { Table } from 'dexie';

export type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BristolLog {
  id?: number;
  type: BristolType;
  recordedAt: number;
  dayKey: string;
  note?: string;
}

export const bristolSchema: Record<string, string> = {
  bristolLogs: '++id, dayKey, recordedAt',
};

export const bristolLogsTable = (): Table<BristolLog, number> =>
  db.t<BristolLog>('bristolLogs');

export interface BristolTypeInfo {
  type: BristolType;
  label: string;
  description: string;
  category: 'constipation' | 'normal' | 'diarrhea';
}

export const BRISTOL_TYPES: BristolTypeInfo[] = [
  { type: 1, label: 'Type 1', description: 'Separate hard lumps', category: 'constipation' },
  { type: 2, label: 'Type 2', description: 'Lumpy sausage shape', category: 'constipation' },
  { type: 3, label: 'Type 3', description: 'Sausage with cracks', category: 'normal' },
  { type: 4, label: 'Type 4', description: 'Smooth, soft sausage (ideal)', category: 'normal' },
  { type: 5, label: 'Type 5', description: 'Soft blobs with clear edges', category: 'diarrhea' },
  { type: 6, label: 'Type 6', description: 'Fluffy, mushy pieces', category: 'diarrhea' },
  { type: 7, label: 'Type 7', description: 'Watery, no solid pieces', category: 'diarrhea' },
];

export function bristolCategoryColor(category: BristolTypeInfo['category']): string {
  switch (category) {
    case 'constipation': return 'text-amber-700 bg-amber-50';
    case 'normal':       return 'text-emerald-700 bg-emerald-50';
    case 'diarrhea':     return 'text-rose-700 bg-rose-50';
  }
}
