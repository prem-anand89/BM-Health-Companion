import { db } from '../../core/db';
import type { Table } from 'dexie';

export interface Symptom {
  id?: number;
  /** Symptom name, e.g. "Headache". */
  type: string;
  /** 0 (none) .. 10 (worst). */
  severity: number;
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

export interface SymptomCategory {
  label: string;
  presets: string[];
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    label: 'General',
    presets: ['Fatigue', 'Fever', 'Chills', 'Weakness', 'Weight change', 'Appetite loss', 'Night sweats'],
  },
  {
    label: 'Head & Neuro',
    presets: ['Headache', 'Migraine', 'Dizziness', 'Brain fog', 'Numbness', 'Tingling', 'Tremor', 'Vision change'],
  },
  {
    label: 'Pain',
    presets: ['Back pain', 'Neck pain', 'Chest pain', 'Stomach pain', 'Joint pain', 'Muscle pain', 'Hip pain', 'Leg pain'],
  },
  {
    label: 'Breathing',
    presets: ['Cough', 'Shortness of breath', 'Wheezing', 'Congestion', 'Runny nose', 'Sore throat'],
  },
  {
    label: 'Digestive',
    presets: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Bloating', 'Heartburn', 'Indigestion'],
  },
  {
    label: 'Mental',
    presets: ['Anxiety', 'Low mood', 'Poor sleep', 'Irritability', 'Stress', 'Confusion'],
  },
  {
    label: 'Skin',
    presets: ['Rash', 'Itching', 'Swelling', 'Bruising', 'Dry skin'],
  },
];

/** Flat list for backwards-compatible use. */
export const SYMPTOM_PRESETS = SYMPTOM_CATEGORIES.flatMap((c) => c.presets);
