import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionHeader } from '../components/ui';
import { FilePicker } from '../components/FilePicker';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { parseCsv } from '../core/csv';
import { modules } from '../core/registry';
import { restoreFromJson, type RestoreMode } from '../core/importData';
import type { GlucoseUnit } from '../core/preferences';
import {
  detectCgmFormat,
  parseCgmRows,
  importGlucose,
  type CgmDetection,
  type GlucoseImportResult,
} from '../modules/glucose/import';
import {
  parseMedCsv,
  parseMedText,
  recognisePrescription,
  importMeds,
  type ParsedMed,
} from '../modules/medications/import';

export function Import() {
  return (
    <div>
      <PageHeader title="Import data" back />
      <p className="mb-5 px-1 text-sm text-slate-500">
        Bring in existing data. Everything is processed on this device — nothing
        is uploaded.
      </p>
      <div className="space-y-8">
        <GlucoseImport />
        <MedicineImport />
        <RestoreBackup />
      </div>
    </div>
  );
}

/* ------------------------------- Glucose / CGM ------------------------------ */

function GlucoseImport() {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [det, setDet] = useState<CgmDetection | null>(null);
  const [tsCol, setTsCol] = useState(-1);
  const [valCol, setValCol] = useState(-1);
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [result, setResult] = useState<GlucoseImportResult | null>(null);
  const [error, setError] = useState('');

  async function onFile(file: File) {
    setResult(null);
    setError('');
    try {
      const parsed = parseCsv(await file.text());
      const d = detectCgmFormat(parsed);
      setRows(parsed);
      setDet(d);
      setTsCol(d.tsCol);
      setValCol(d.valCol);
      setUnit(d.unit);
    } catch {
      setError('Could not read that file.');
    }
  }

  const effective: CgmDetection | null = det && { ...det, tsCol, valCol, unit };
  const parsedRows = rows && effective ? parseCgmRows(rows, effective) : [];
  const range = parsedRows.length
    ? `${parsedRows.map((r) => r.dayKey).sort()[0]} → ${parsedRows.map((r) => r.dayKey).sort().slice(-1)[0]}`
    : null;

  async function doImport() {
    if (!parsedRows.length) return;
    const res = await importGlucose(parsedRows);
    setResult(res);
    setRows(null);
    setDet(null);
  }

  const vendorLabel =
    det?.vendor === 'libre' ? 'FreeStyle Libre' : det?.vendor === 'dexcom' ? 'Dexcom Clarity' : 'Generic CSV';

  return (
    <section>
      <SectionHeader title="Glucose / CGM report" />
      <Card className="space-y-4">
        {!det ? (
          <>
            <p className="text-sm text-slate-600">
              Import a CSV exported from your meter or CGM (FreeStyle Libre, Dexcom
              Clarity, or any CSV with a date and a glucose value).
            </p>
            <FilePicker accept=".csv,text/csv" onFile={onFile}>
              Choose CSV file
            </FilePicker>
            {result && (
              <p className="text-sm font-semibold text-emerald-700">
                ✓ Imported {result.added} reading{result.added === 1 ? '' : 's'}
                {result.skipped > 0 && ` · skipped ${result.skipped} already present`}
                {result.range && ` · ${result.range.from} → ${result.range.to}`}
              </p>
            )}
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-700">Detected: {vendorLabel}</p>

            {det.vendor === 'generic' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Tell us which columns to use:
                </p>
                <ColumnSelect label="Date / time column" headers={det.headers} value={tsCol} onChange={setTsCol} />
                <ColumnSelect label="Glucose value column" headers={det.headers} value={valCol} onChange={setValCol} />
                <div>
                  <label className="field-label">Unit</label>
                  <div className="flex gap-2">
                    {(['mg/dL', 'mmol/L'] as GlucoseUnit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`flex-1 rounded-2xl py-2 text-sm font-semibold transition ${
                          unit === u ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600">
              {parsedRows.length} reading{parsedRows.length === 1 ? '' : 's'} found
              {range && ` · ${range}`}
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setDet(null)}>
                Cancel
              </button>
              <button className="btn-primary flex-1" onClick={doImport} disabled={!parsedRows.length}>
                Import {parsedRows.length}
              </button>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}

function ColumnSelect({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="field-input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={-1}>Select a column…</option>
        {headers.map((h, i) => (
          <option key={i} value={i}>
            {h || `Column ${i + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------- Medicines -------------------------------- */

type MedTab = 'csv' | 'paste' | 'photo';

function MedicineImport() {
  const [tab, setTab] = useState<MedTab>('paste');
  const [meds, setMeds] = useState<ParsedMed[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [error, setError] = useState('');

  function update(i: number, patch: Partial<ParsedMed>) {
    setMeds((ms) => ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function onCsv(file: File) {
    setError('');
    setAddedCount(null);
    try {
      setMeds(parseMedCsv(parseCsv(await file.text())));
    } catch {
      setError('Could not read that CSV.');
    }
  }

  async function onPhoto(file: File) {
    setError('');
    setAddedCount(null);
    setOcrProgress(0);
    try {
      const text = await recognisePrescription(file, (f) => setOcrProgress(f));
      const parsed = parseMedText(text);
      setMeds(parsed);
      if (parsed.length === 0) {
        setError('No medicine names were recognised. Try a clearer, well-lit, straight-on photo.');
      }
    } catch (e) {
      setError(
        `Could not read that image: ${e instanceof Error ? e.message : 'unknown error'}. ` +
          'A clearer photo or a working connection (for first-time setup) may help.',
      );
    } finally {
      setOcrProgress(null);
    }
  }

  async function doImport() {
    const n = await importMeds(meds);
    setAddedCount(n);
    setMeds([]);
    setPasteText('');
  }

  const willAdd = meds.filter((m) => m.include && m.name.trim()).length;

  return (
    <section>
      <SectionHeader title="Medicines" />
      <Card className="space-y-4">
        <div className="flex gap-2">
          {(['paste', 'csv', 'photo'] as MedTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-2xl py-2 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t === 'photo' ? 'Photo' : t === 'csv' ? 'CSV' : 'Paste'}
            </button>
          ))}
        </div>

        {tab === 'paste' && (
          <div className="space-y-2">
            <textarea
              className="field-input"
              rows={4}
              placeholder={'One medicine per line, e.g.\nMetformin 500 mg twice daily\nAtorvastatin 10 mg at night'}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              className="btn-ghost w-full"
              onClick={() => setMeds(parseMedText(pasteText))}
              disabled={!pasteText.trim()}
            >
              Parse list
            </button>
          </div>
        )}

        {tab === 'csv' && (
          <FilePicker accept=".csv,text/csv" onFile={onCsv} className="btn-ghost w-full">
            Choose CSV file
          </FilePicker>
        )}

        {tab === 'photo' && (
          <div className="space-y-2">
            <FilePicker accept="image/*" capture="environment" onFile={onPhoto} className="btn-ghost w-full">
              Photograph / choose prescription
            </FilePicker>
            {ocrProgress !== null && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${Math.round(ocrProgress * 100)}%` }} />
                </div>
                <p className="text-xs text-slate-500">Reading image… {Math.round(ocrProgress * 100)}%</p>
              </div>
            )}
            <p className="text-xs text-slate-400">
              The photo is read on your device and never uploaded. Always check the
              result below before saving.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {addedCount !== null && (
          <p className="text-sm font-semibold text-emerald-700">
            ✓ Added {addedCount} medicine{addedCount === 1 ? '' : 's'}
          </p>
        )}

        {meds.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Review ({willAdd} selected) — edit anything that looks wrong:
            </p>
            <ul className="space-y-2">
              {meds.map((m, i) => (
                <li key={i} className={`rounded-2xl border p-3 ${m.include ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.include}
                      onChange={(e) => update(i, { include: e.target.checked })}
                      className="h-5 w-5 accent-brand-600"
                      aria-label={`Include ${m.name}`}
                    />
                    <input
                      className="field-input !py-2 flex-1"
                      value={m.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-input !py-2"
                      value={m.dose}
                      onChange={(e) => update(i, { dose: e.target.value })}
                      placeholder="Dose"
                    />
                    <input
                      className="field-input !py-2"
                      value={m.times.join(', ')}
                      onChange={(e) =>
                        update(i, {
                          times: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Times (HH:mm)"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <button className="btn-primary w-full" onClick={doImport} disabled={willAdd === 0}>
              Add {willAdd} medicine{willAdd === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}

/* ------------------------------ Restore backup ----------------------------- */

function RestoreBackup() {
  const [json, setJson] = useState<unknown>(null);
  const [counts, setCounts] = useState<{ table: string; n: number }[]>([]);
  const [pendingMode, setPendingMode] = useState<RestoreMode | null>(null);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function onFile(file: File) {
    setError('');
    setDone('');
    try {
      const data = JSON.parse(await file.text());
      const c = Object.entries(data)
        .filter(([, v]) => Array.isArray(v))
        .map(([table, v]) => ({ table, n: (v as unknown[]).length }));
      setJson(data);
      setCounts(c);
    } catch {
      setError('That file is not a valid backup.');
    }
  }

  async function run(mode: RestoreMode) {
    setPendingMode(null);
    try {
      const res = await restoreFromJson(json, mode, modules);
      setDone(`✓ Restored ${res.total} record${res.total === 1 ? '' : 's'} across ${res.tables.length} categories.`);
      setJson(null);
      setCounts([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed.');
    }
  }

  return (
    <section>
      <SectionHeader title="Restore from backup" />
      <Card className="space-y-4">
        <p className="text-sm text-slate-600">
          Restore data from a JSON file you exported in Settings. Merge keeps
          current data; Replace clears it first. (Settings/preferences aren't
          included.)
        </p>
        <FilePicker accept=".json,application/json" onFile={onFile} className="btn-ghost w-full">
          Choose backup file
        </FilePicker>

        {counts.length > 0 && (
          <>
            <p className="text-sm text-slate-600">
              Found {counts.reduce((s, c) => s + c.n, 0)} records ({counts.map((c) => `${c.table}: ${c.n}`).join(', ')}).
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setPendingMode('merge')}>
                Merge
              </button>
              <button className="btn flex-1 bg-rose-600 text-white" onClick={() => setPendingMode('replace')}>
                Replace all
              </button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {done && <p className="text-sm font-semibold text-emerald-700">{done}</p>}
      </Card>

      <ConfirmDialog
        open={pendingMode === 'replace'}
        title="Replace all data?"
        body="This clears your current records and replaces them with the backup. This can't be undone."
        confirmLabel="Replace"
        onConfirm={() => run('replace')}
        onCancel={() => setPendingMode(null)}
      />
      <ConfirmDialog
        open={pendingMode === 'merge'}
        danger={false}
        title="Merge backup?"
        body="Records from the backup will be added to your current data."
        confirmLabel="Merge"
        onConfirm={() => run('merge')}
        onCancel={() => setPendingMode(null)}
      />
    </section>
  );
}
