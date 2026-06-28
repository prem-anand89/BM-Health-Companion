import { db } from '../../core/db';
import type { Table } from 'dexie';

export type SupplementForm = 'tablet' | 'capsule' | 'softgel' | 'powder' | 'liquid' | 'gummy' | 'other';

export interface Supplement {
  id?: number;
  name: string;
  dose: string;
  form: SupplementForm;
  times: string[];
  daysOfWeek: number[];
  startDate: string;
  endDate?: string;
  quantityRemaining?: number;
  notes?: string;
  createdAt: number;
  archived?: boolean;
}

export type SupplementStatus = 'taken' | 'skipped' | 'stopped';

export interface SupplementLog {
  id?: number;
  suppId: number;
  dayKey: string;
  time: string;
  status: SupplementStatus;
  recordedAt: number;
}

export const supplementsSchema: Record<string, string> = {
  supplements: '++id, name, archived, createdAt',
  supplementLogs: '++id, suppId, dayKey, [suppId+dayKey], [dayKey+time]',
};

export const supplementsTable = (): Table<Supplement, number> =>
  db.t<Supplement>('supplements');
export const supplementLogsTable = (): Table<SupplementLog, number> =>
  db.t<SupplementLog>('supplementLogs');
