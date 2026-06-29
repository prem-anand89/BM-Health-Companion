import { dayKey } from '../../core/dates';
import { medicationsTable, type Medication, type MedForm } from './db';

export interface ParsedMed {
  name: string;
  dose: string;
  form: MedForm;
  times: string[];
  daysOfWeek: number[];
  notes?: string;
  /** Whether this row is selected for import on the review screen. */
  include: boolean;
}

const FORMS: MedForm[] = ['tablet', 'capsule', 'liquid', 'injection', 'other'];

const DOSE_RE = /\d+(?:\.\d+)?\s?(?:mg|mcg|µg|g|ml|iu|units?|tablets?|caps?|capsules?|puffs?|drops?|sprays?)\b/i;

/** Map common frequency wording → scheduled times of day. */
export function parseFrequency(text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  const has = (re: RegExp) => re.test(t);
  if (has(/\b(qid|qds|four times|4x|4 times)\b/)) return ['08:00', '12:00', '16:00', '20:00'];
  if (has(/\b(tid|tds|thrice|three times|3x|3 times)\b/)) return ['08:00', '14:00', '20:00'];
  if (has(/\b(bid|bd|twice|two times|2x|2 times)\b/)) return ['08:00', '20:00'];
  if (has(/\b(hs|qhs|at night|nightly|bedtime|evening|qpm)\b/)) return ['20:00'];
  if (has(/\b(qam|morning)\b/)) return ['08:00'];
  // od / once / daily, or no signal at all → once in the morning.
  return ['08:00'];
}

function pickForm(text: string): MedForm {
  const t = text.toLowerCase();
  if (/\b(cap|capsule)\b/.test(t)) return 'capsule';
  if (/\b(syrup|liquid|solution|ml|drops?)\b/.test(t)) return 'liquid';
  if (/\b(inject|injection|insulin|pen|units?|iu)\b/.test(t)) return 'injection';
  if (/\b(tablet|tab|pill)\b/.test(t)) return 'tablet';
  return 'tablet';
}

/** Strip list markers like "1.", "-", "•" and collapse whitespace. */
function cleanName(s: string): string {
  return s
    .replace(/^[\s\d]*[.)\]-]\s*/, '')
    .replace(/^[•*-]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Best-effort parse of a free-text medicine list (one medicine per line). The
 * review screen lets the user correct anything we get wrong, so we favour
 * recall over precision.
 */
export function parseMedText(text: string): ParsedMed[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .map((line) => {
      const doseMatch = line.match(DOSE_RE);
      const dose = doseMatch ? doseMatch[0].trim() : '';
      // Name = the line up to the dose (or first comma), minus list markers.
      let namePart = line;
      if (doseMatch && doseMatch.index != null) namePart = line.slice(0, doseMatch.index);
      namePart = namePart.split(',')[0];
      const name = cleanName(namePart) || cleanName(line);
      return {
        name,
        dose,
        form: pickForm(line),
        times: parseFrequency(line),
        daysOfWeek: [],
        notes: undefined,
        include: name.length > 0,
      };
    })
    .filter((m) => m.name.length > 0);
}

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function parseDays(cell: string): number[] {
  if (!cell.trim()) return [];
  const out = new Set<number>();
  for (const tok of cell.toLowerCase().split(/[;,\s]+/)) {
    const k = tok.slice(0, 3);
    if (k in DAY_MAP) out.add(DAY_MAP[k]);
  }
  return [...out].sort();
}

/**
 * Parse a CSV medicine list. Expects a header row; recognised columns
 * (case-insensitive): name, dose, form, times (";"-separated HH:mm), days, notes.
 */
export function parseMedCsv(rows: string[][]): ParsedMed[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const ci = {
    name: col('name'),
    dose: col('dose'),
    form: col('form'),
    times: col('times'),
    days: col('days'),
    notes: col('notes'),
  };
  if (ci.name === -1) return [];

  return rows.slice(1).map((r) => {
    const name = (r[ci.name] ?? '').trim();
    const formRaw = (ci.form !== -1 ? r[ci.form] : '').trim().toLowerCase() as MedForm;
    const timesRaw = ci.times !== -1 ? r[ci.times] : '';
    const times = timesRaw
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      name,
      dose: (ci.dose !== -1 ? r[ci.dose] : '').trim(),
      form: FORMS.includes(formRaw) ? formRaw : 'tablet',
      times: times.length ? times : ['08:00'],
      daysOfWeek: ci.days !== -1 ? parseDays(r[ci.days] ?? '') : [],
      notes: (ci.notes !== -1 ? r[ci.notes] : '').trim() || undefined,
      include: name.length > 0,
    };
  }).filter((m) => m.name.length > 0);
}

/**
 * Run on-device OCR over a prescription image and return the recognised text.
 * Tesseract is dynamically imported (kept out of the main bundle) and points at
 * self-hosted assets so the image never leaves the device.
 */
export async function recognisePrescription(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const base = import.meta.env.BASE_URL;
  // The OCR worker + wasm engine are self-hosted (no CDN). The ~1.5MB English
  // language model is fetched once from the default tessdata CDN and then
  // cached; the prescription image itself is always processed locally in the
  // browser and never uploaded anywhere.
  const worker = await createWorker('eng', 1, {
    workerPath: `${base}tesseract/worker.min.js`,
    corePath: `${base}tesseract/`,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}

/** Add the selected parsed medicines to the database. */
export async function importMeds(meds: ParsedMed[]): Promise<number> {
  const selected = meds.filter((m) => m.include && m.name.trim());
  if (selected.length === 0) return 0;
  const today = dayKey();
  const rows: Medication[] = selected.map((m) => ({
    name: m.name.trim(),
    dose: m.dose.trim(),
    form: m.form,
    times: m.times.length ? [...new Set(m.times)].sort() : ['08:00'],
    daysOfWeek: m.daysOfWeek,
    startDate: today,
    notes: m.notes?.trim() || undefined,
    createdAt: Date.now(),
  }));
  await medicationsTable().bulkAdd(rows);
  return rows.length;
}
