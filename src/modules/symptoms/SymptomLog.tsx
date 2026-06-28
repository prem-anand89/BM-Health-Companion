import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { symptomsTable, SYMPTOM_PRESETS } from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

/** Severity scale with faces + colour so it reads at a glance, no jargon. */
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
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState(3);
  const [note, setNote] = useState('');

  async function save() {
    if (!type.trim()) return;
    await symptomsTable().add({
      type: type.trim(),
      severity,
      recordedAt: Date.now(),
      dayKey: dayKey(),
      note: note.trim() || undefined,
    });
    navigate('/m/symptoms');
  }

  return (
    <div>
      <PageHeader title="How are you feeling?" back />

      <div className="space-y-4">
        <Card className="space-y-3">
          <label className="field-label">What are you noticing?</label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setType(preset)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  type === preset
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            className="field-input"
            placeholder="Or type your own"
            value={SYMPTOM_PRESETS.includes(type) ? '' : type}
            onChange={(e) => setType(e.target.value)}
          />
        </Card>

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
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="h-3 w-full cursor-pointer accent-brand-600"
          />
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

        <button className="btn-primary w-full" onClick={save} disabled={!type.trim()}>
          Save entry
        </button>
      </div>
    </div>
  );
}
