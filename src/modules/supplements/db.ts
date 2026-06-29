import { db } from '../../core/db';
import type { Table } from 'dexie';

export type SupplementForm = 'tablet' | 'capsule' | 'softgel' | 'powder' | 'liquid' | 'gummy' | 'other';
export type SupplementCategory = 'vitamin' | 'mineral' | 'probiotic' | 'omega' | 'herb' | 'other';

export const SUPPLEMENT_CATEGORIES: { value: SupplementCategory; label: string; emoji: string }[] = [
  { value: 'vitamin',   label: 'Vitamin',   emoji: '🌟' },
  { value: 'mineral',   label: 'Mineral',   emoji: '💎' },
  { value: 'probiotic', label: 'Probiotic', emoji: '🦠' },
  { value: 'omega',     label: 'Omega / Fish Oil', emoji: '🐟' },
  { value: 'herb',      label: 'Herb / Botanical', emoji: '🌿' },
  { value: 'other',     label: 'Other',     emoji: '💊' },
];

export interface Supplement {
  id?: number;
  name: string;
  dose: string;
  form: SupplementForm;
  /** High-level category for grouping. */
  category?: SupplementCategory;
  /** Probiotic-specific: strain names, e.g. "Lactobacillus acidophilus, Bifidobacterium". */
  strains?: string;
  /** Probiotic-specific: CFU count in billions. */
  cfuBillions?: number;
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
