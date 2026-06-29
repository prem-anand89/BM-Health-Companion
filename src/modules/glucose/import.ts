import { parse, isValid } from 'date-fns';
import { dayKey } from '../../core/dates';
import type { GlucoseUnit } from '../../core/preferences';
import { glucoseLogsTable, type GlucoseLog } from './db';

export type CgmVendor = 'libre' | 'dexcom' | 'generic';

export interface CgmDetection {
  vendor: CgmVendor;
  /** Index of the header row within the parsed CSV. */
  headerRowIndex: number;
  /** Header cell labels (for the generic column-mapping UI). */
  headers: string[];
  /** Column index of the timestamp, or -1 if the user must choose (generic). */
  tsCol: number;
  /** Column index of the glucose value, or -1 if the user must choose. */
  valCol: number;
  /** Detected unit; the user can override for generic files. */
  unit: GlucoseUnit;
}

const TS_PATTERNS = [
  // date-fns format strings tried in order; first valid wins.
  "yyyy-MM-dd'T'HH:mm:ss",
  'yyyy-MM-dd HH:mm:ss',
  'MM-dd-yyyy HH:mm',
  'MM-dd-yyyy hh:mm a',
  'dd-MM-yyyy HH:mm',
  'MM/dd/yyyy HH:mm',
  'MM/dd/yyyy hh:mm a',
  'dd/MM/yyyy HH:mm',
  'yyyy/MM/dd HH:mm',
];

/** Best-effort timestamp parse across the common CGM export formats. */
export function parseTimestamp(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  // Native ISO / RFC handling first (Dexcom uses ISO).
  const native = Date.parse(s);
  if (!Number.isNaN(native)) return native;
  for (const fmt of TS_PATTERNS) {
    const d = parse(s, fmt, new Date());
    if (isValid(d)) return d.getTime();
  }
  return null;
}

function unitFromHeader(header: string): GlucoseUnit {
  return /mmol/i.test(header) ? 'mmol/L' : 'mg/dL';
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Sniff the vendor and locate the timestamp/value columns by scanning for a
 * header row with recognisable labels. Returns vendor 'generic' (with tsCol/
 * valCol = -1) when nothing matches, so the UI can ask the user to map columns.
 */
export function detectCgmFormat(rows: string[][]): CgmDetection {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const cells = rows[i];
    const lc = cells.map(norm);

    // Dexcom Clarity: ISO timestamp + "Glucose Value (mg/dL|mmol/L)".
    const dexTs = lc.findIndex((c) => c.startsWith('timestamp'));
    const dexVal = lc.findIndex((c) => c.startsWith('glucose value'));
    if (dexTs !== -1 && dexVal !== -1) {
      return {
        vendor: 'dexcom',
        headerRowIndex: i,
        headers: cells,
        tsCol: dexTs,
        valCol: dexVal,
        unit: unitFromHeader(cells[dexVal]),
      };
    }

    // FreeStyle Libre / LibreView: "Device Timestamp" + "Historic Glucose ...".
    const libreTs = lc.findIndex((c) => c.includes('timestamp'));
    const libreVal = lc.findIndex(
      (c) => c.includes('historic glucose') || c.includes('glucose mg/dl') || c.includes('glucose mmol/l'),
    );
    if (libreTs !== -1 && libreVal !== -1) {
      return {
        vendor: 'libre',
        headerRowIndex: i,
        headers: cells,
        tsCol: libreTs,
        valCol: libreVal,
        unit: unitFromHeader(cells[libreVal]),
      };
    }
  }

  // Generic: assume row 0 is the header; user maps columns.
  const headers = rows[0] ?? [];
  return {
    vendor: 'generic',
    headerRowIndex: 0,
    headers,
    tsCol: -1,
    valCol: -1,
    unit: 'mg/dL',
  };
}

/** For Dexcom, only "EGV" event-type rows are glucose readings. */
function dexcomEventTypeCol(headers: string[]): number {
  return headers.map(norm).findIndex((c) => c === 'event type');
}

/**
 * Turn parsed CSV rows into GlucoseLog records using a resolved detection
 * (the generic path fills tsCol/valCol/unit from the user's mapping first).
 */
export function parseCgmRows(rows: string[][], det: CgmDetection): Omit<GlucoseLog, 'id'>[] {
  if (det.tsCol < 0 || det.valCol < 0) return [];
  const headers = rows[det.headerRowIndex] ?? [];
  const evtCol = det.vendor === 'dexcom' ? dexcomEventTypeCol(headers) : -1;
  const vendorLabel = det.vendor === 'libre' ? 'Libre' : det.vendor === 'dexcom' ? 'Dexcom' : 'CGM';

  const out: Omit<GlucoseLog, 'id'>[] = [];
  for (let i = det.headerRowIndex + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (evtCol !== -1 && norm(cells[evtCol] ?? '') !== 'egv') continue;

    const rawVal = (cells[det.valCol] ?? '').trim();
    if (!rawVal || /^(high|low|hi|lo)$/i.test(rawVal)) continue;
    const value = Number(rawVal);
    if (!Number.isFinite(value) || value <= 0) continue;

    const ts = parseTimestamp(cells[det.tsCol] ?? '');
    if (ts == null) continue;

    out.push({
      value,
      unit: det.unit,
      context: 'random',
      recordedAt: ts,
      dayKey: dayKey(ts),
      note: `${vendorLabel} CGM import`,
    });
  }
  return out;
}

export interface GlucoseImportResult {
  added: number;
  skipped: number;
  range: { from: string; to: string } | null;
}

/**
 * Persist parsed readings, skipping any whose exact timestamp already exists
 * (so re-importing the same export is a no-op).
 */
export async function importGlucose(rows: Omit<GlucoseLog, 'id'>[]): Promise<GlucoseImportResult> {
  if (rows.length === 0) return { added: 0, skipped: 0, range: null };

  const existing = new Set((await glucoseLogsTable().toArray()).map((r) => r.recordedAt));
  const fresh: Omit<GlucoseLog, 'id'>[] = [];
  let skipped = 0;
  // Also de-dup within the imported batch itself.
  const seen = new Set<number>();
  for (const r of rows) {
    if (existing.has(r.recordedAt) || seen.has(r.recordedAt)) {
      skipped++;
      continue;
    }
    seen.add(r.recordedAt);
    fresh.push(r);
  }

  if (fresh.length > 0) {
    await glucoseLogsTable().bulkAdd(fresh as GlucoseLog[]);
  }

  const days = rows.map((r) => r.dayKey).sort();
  return {
    added: fresh.length,
    skipped,
    range: days.length ? { from: days[0], to: days[days.length - 1] } : null,
  };
}
