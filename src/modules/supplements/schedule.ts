import { parseISO, getDay } from 'date-fns';
import type { Supplement, SupplementLog, SupplementStatus } from './db';
import { startOfDayMs } from '../../core/dates';

export function isDueOnDay(supp: Supplement, dayKey: string): boolean {
  if (supp.archived) return false;
  const dayMs = startOfDayMs(dayKey);
  if (dayMs < startOfDayMs(supp.startDate)) return false;
  if (supp.endDate && dayMs > startOfDayMs(supp.endDate)) return false;
  if (supp.daysOfWeek.length > 0 && !supp.daysOfWeek.includes(getDay(parseISO(dayKey)))) {
    return false;
  }
  return true;
}

export function dueSlots(supp: Supplement, dayKey: string): string[] {
  if (!isDueOnDay(supp, dayKey)) return [];
  return [...supp.times].sort();
}

export interface SupplementDose {
  supp: Supplement;
  time: string;
  dayKey: string;
  status: SupplementStatus | 'pending';
}

export function buildDayDoses(
  supps: Supplement[],
  logs: SupplementLog[],
  dayKey: string,
): SupplementDose[] {
  const logByKey = new Map<string, SupplementLog>();
  for (const log of logs) logByKey.set(`${log.suppId}@${log.time}`, log);

  const doses: SupplementDose[] = [];
  for (const supp of supps) {
    for (const time of dueSlots(supp, dayKey)) {
      const log = logByKey.get(`${supp.id}@${time}`);
      doses.push({ supp, time, dayKey, status: log?.status ?? 'pending' });
    }
  }
  return doses.sort((a, b) => a.time.localeCompare(b.time));
}

export interface DayAdherence {
  due: number;
  taken: number;
  ratio: number;
}

export function dayAdherence(doses: SupplementDose[]): DayAdherence {
  const active = doses.filter((d) => d.status !== 'stopped');
  const due = active.length;
  const taken = active.filter((d) => d.status === 'taken').length;
  return { due, taken, ratio: due === 0 ? 1 : taken / due };
}
