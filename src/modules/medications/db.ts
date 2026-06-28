import { db } from '../../core/db';
import type { Table } from 'dexie';

export type MedForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'other';

export interface Medication {
  id?: number;
  name: string;
  dose: string; // free text, e.g. "500 mg"
  form: MedForm;
  /** Scheduled times of day as "HH:mm", 24h. */
  times: string[];
  /** Days of week (0=Sun..6=Sat) it applies to; empty = every day. */
  daysOfWeek: number[];
  /** yyyy-MM-dd the schedule starts. */
  startDate: string;
  /** Optional yyyy-MM-dd the schedule ends (inclusive). */
  endDate?: string;
  /** Optional remaining pill/dose count, for refill estimates. */
  quantityRemaining?: number;
  notes?: string;
  createdAt: number;
  archived?: boolean;
}

export type DoseStatus = 'taken' | 'skipped';

export interface MedLog {
  id?: number;
  medId: number;
  /** yyyy-MM-dd the dose was for. */
  dayKey: string;
  /** The scheduled slot ("HH:mm") this log resolves. */
  time: string;
  status: DoseStatus;
  /** When the user actually recorded it. */
  recordedAt: number;
}

/** This module's contribution to the shared Dexie schema. */
export const medicationsSchema: Record<string, string> = {
  medications: '++id, name, archived, createdAt',
  // Compound index lets us load a single day's logs efficiently.
  medLogs: '++id, medId, dayKey, [medId+dayKey], [dayKey+time]',
};

export const medicationsTable = (): Table<Medication, number> =>
  db.t<Medication>('medications');
export const medLogsTable = (): Table<MedLog, number> => db.t<MedLog>('medLogs');
