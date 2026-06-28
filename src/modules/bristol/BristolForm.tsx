import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bristolLogsTable, BRISTOL_TYPES, bristolCategoryColor, type BristolType } from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

export function BristolForm() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BristolType | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (selected === null) return;
    setSaving(true);
    await bristolLogsTable().add({
      type: selected,
      recordedAt: Date.now(),
      dayKey: dayKey(),
      note: note.trim() || undefined,
    });
    navigate(-1);
  }

  return (
    <div>
      <PageHeader title="Log Bowel Movement" back />
      <div className="space-y-4">
        <p className="text-sm text-slate-500 px-1">
          Select the type that best describes today's movement:
        </p>
        <div className="space-y-2">
          {BRISTOL_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setSelected(t.type)}
              className={`w-full rounded-3xl border-2 p-4 text-left transition ${
                selected === t.type
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-transparent bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{t.label}</p>
                  <p className="text-sm text-slate-500">{t.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bristolCategoryColor(t.category)}`}>
                  {t.category === 'constipation' ? 'Constipation' : t.category === 'normal' ? 'Normal' : 'Loose'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <Card className="space-y-4">
          <div>
            <label className="field-label">Note (optional)</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g. some discomfort"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            className="btn-primary w-full"
            onClick={save}
            disabled={saving || selected === null}
          >
            Save entry
          </button>
        </Card>
      </div>
    </div>
  );
}
