import { db } from '../../core/db';
import type { Table } from 'dexie';

export type ExerciseType = 'walk' | 'run' | 'cycle' | 'swim' | 'gym' | 'yoga' | 'other';
export type ExerciseIntensity = 'light' | 'moderate' | 'vigorous';

export interface ExerciseLog {
  id?: number;
  type: ExerciseType;
  duration: number; // minutes
  intensity: ExerciseIntensity;
  steps?: number;
  distanceKm?: number;
  recordedAt: number;
  dayKey: string;
  note?: string;
}

export const exerciseSchema: Record<string, string> = {
  exerciseLogs: '++id, dayKey, recordedAt',
};

export const exerciseLogsTable = (): Table<ExerciseLog, number> =>
  db.t<ExerciseLog>('exerciseLogs');

export const EXERCISE_TYPES: { value: ExerciseType; label: string; emoji: string }[] = [
  { value: 'walk',  label: 'Walk',   emoji: '🚶' },
  { value: 'run',   label: 'Run',    emoji: '🏃' },
  { value: 'cycle', label: 'Cycle',  emoji: '🚴' },
  { value: 'swim',  label: 'Swim',   emoji: '🏊' },
  { value: 'gym',   label: 'Gym',    emoji: '🏋️' },
  { value: 'yoga',  label: 'Yoga',   emoji: '🧘' },
  { value: 'other', label: 'Other',  emoji: '⚡' },
];

export const EXERCISE_INTENSITIES: { value: ExerciseIntensity; label: string; hint: string }[] = [
  { value: 'light',    label: 'Light',    hint: 'Easy pace, can sing' },
  { value: 'moderate', label: 'Moderate', hint: 'Breathing harder, can talk' },
  { value: 'vigorous', label: 'Vigorous', hint: 'Hard, can only say a few words' },
];
