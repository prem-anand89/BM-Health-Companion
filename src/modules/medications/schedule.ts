import { parseISO, getDay } from 'date-fns';
import type { Medication, MedLog, DoseStatus } from './db';
import { startOfDayMs } from '../../core/dates';

/** True if this medication is scheduled on the given day key. */
export function isDueOnDay(med: Medication, dayKey: string): boolean {
  if (med.archived) return false;
  const dayMs = startOfDayMs(dayKey);
  if (dayMs < startOfDayMs(med.startDate)) return false;
  if (med.endDate && dayMs > startOfDayMs(med.endDate)) return false;
  if (med.daysOfWeek.length > 0 && !med.daysOfWeek.includes(getDay(parseISO(dayKey)))) {
    return false;
  }
  return true;
}

/** The scheduled time slots for a med on a day (sorted), or [] if not due. */
export function dueSlots(med: Medication, dayKey: string): string[] {
  if (!isDueOnDay(med, dayKey)) return [];
  return [...med.times].sort();
}

export interface DoseInstance {
  med: Medication;
  time: string;
  dayKey: string;
  status: DoseStatus | 'pending';
}

/**
 * Build the list of dose instances for a single day across all meds, resolving
 * each against the day's logs. Drives the "Today" view.
 */
export function buildDayDoses(
  meds: Medication[],
  logs: MedLog[],
  dayKey: string,
): DoseInstance[] {
  const logByKey = new Map<string, MedLog>();
  for (const log of logs) logByKey.set(`${log.medId}@${log.time}`, log);

  const doses: DoseInstance[] = [];
  for (const med of meds) {
    for (const time of dueSlots(med, dayKey)) {
      const log = logByKey.get(`${med.id}@${time}`);
      doses.push({
        med,
        time,
        dayKey,
        status: log?.status ?? 'pending',
      });
    }
  }
  return doses.sort((a, b) => a.time.localeCompare(b.time));
}

export interface DayAdherence {
  due: number;
  taken: number;
  /** 0..1; 1 when nothing is due (no failure). */
  ratio: number;
}

export function dayAdherence(doses: DoseInstance[]): DayAdherence {
  const due = doses.length;
  const taken = doses.filter((d) => d.status === 'taken').length;
  return { due, taken, ratio: due === 0 ? 1 : taken / due };
}
