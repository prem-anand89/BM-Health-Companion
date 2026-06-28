import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { glucoseLogsTable, GLUCOSE_CONTEXTS, type GlucoseContext } from './db';
import { getPreferences } from '../../core/preferences';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

export function GlucoseForm() {
  const navigate = useNavigate();
  const { glucoseUnit } = getPreferences();
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>('fasting');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const placeholder = glucoseUnit === 'mmol/L' ? 'e.g. 5.5' : 'e.g. 100';

  async function save() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    await glucoseLogsTable().add({
      value: num,
      unit: glucoseUnit,
      context,
      recordedAt: Date.now(),
      dayKey: dayKey(),
      note: note.trim() || undefined,
    });
    navigate(-1);
  }

  return (
    <div>
      <PageHeader title="Log Blood Glucose" back />
      <Card className="space-y-5">
        <div>
          <label className="field-label">Reading ({glucoseUnit})</label>
          <input
            type="number"
            inputMode="decimal"
            className="field-input text-2xl"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="field-label">Context</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {GLUCOSE_CONTEXTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContext(c)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  context === c
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Note (optional)</label>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. after breakfast"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={save}
          disabled={saving || !value}
        >
          Save reading
        </button>
      </Card>
    </div>
  );
}
