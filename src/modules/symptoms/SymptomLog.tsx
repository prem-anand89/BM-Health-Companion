import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { symptomsTable, SYMPTOM_CATEGORIES } from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

const FACES = ['😀', '🙂', '😐', '😟', '😣', '😖'];
function faceFor(severity: number): string {
  return FACES[Math.min(FACES.length - 1, Math.floor(severity / 2))];
}
function severityLabel(s: number): string {
  if (s === 0) return 'None';
  if (s <= 3) return 'Mild';
  if (s <= 6) return 'Moderate';
  if (s <= 8) return 'Severe';
  return 'Worst';
}

export function SymptomLog() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customType, setCustomType] = useState('');
  const [severity, setSeverity] = useState(3);
  const [note, setNote] = useState('');

  function togglePreset(preset: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(preset)) next.delete(preset);
      else next.add(preset);
      return next;
    });
    // Clear custom input when a preset is selected
    setCustomType('');
  }

  /** All types to save: selected presets + custom text if any. */
  function allTypes(): string[] {
    const types = [...selected];
    const custom = customType.trim();
    if (custom && !types.includes(custom)) types.push(custom);
    return types;
  }

  const canSave = allTypes().length > 0;

  async function save() {
    const types = allTypes();
    if (types.length === 0) return;
    const now = Date.now();
    const dk = dayKey();
    await Promise.all(
      types.map((type) =>
        symptomsTable().add({
          type,
          severity,
          recordedAt: now,
          dayKey: dk,
          note: note.trim() || undefined,
        }),
      ),
    );
    navigate('/m/symptoms');
  }

  return (
    <div>
      <PageHeader title="How are you feeling?" back />

      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <label className="field-label">What are you noticing?</label>
            <p className="mb-3 text-sm text-slate-500">Tap all that apply</p>
          </div>
          {SYMPTOM_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {cat.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.presets.map((preset) => {
                  const active = selected.has(preset);
                  return (
                    <button
                      key={preset}
                      onClick={() => togglePreset(preset)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 active:scale-95'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Other
            </p>
            <input
              className="field-input"
              placeholder="Type your own symptom"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
            />
          </div>
        </Card>

        {selected.size > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {[...selected].map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800"
              >
                {s}
                <button
                  onClick={() => togglePreset(s)}
                  className="ml-1 text-brand-600"
                  aria-label={`Remove ${s}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <Card className="space-y-4">
          <label className="field-label">How bad is it?</label>
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl" aria-hidden>
              {faceFor(severity)}
            </span>
            <span className="text-lg font-bold text-slate-800">
              {severity}/10 · {severityLabel(severity)}
            </span>
          </div>
          {/* Discrete buttons instead of a slider — far easier for users with
              tremor or reduced fine motor control (plan item K / §4.2). */}
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 11 }, (_, n) => {
              const active = severity === n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`Severity ${n} out of 10`}
                  aria-pressed={active}
                  onClick={() => setSeverity(n)}
                  className={`flex h-12 items-center justify-center rounded-2xl text-base font-bold transition ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 active:scale-95'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>None</span>
            <span>Worst</span>
          </div>
        </Card>

        <Card>
          <label className="field-label">Note (optional)</label>
          <textarea
            className="field-input"
            rows={2}
            placeholder="e.g. after lunch, started suddenly"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>

        <button className="btn-primary w-full" onClick={save} disabled={!canSave}>
          Save{selected.size > 1 ? ` ${selected.size} symptoms` : ' entry'}
        </button>
      </div>
    </div>
  );
}
