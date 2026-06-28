import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bpLogsTable } from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

export function BPForm() {
  const navigate = useNavigate();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return;
    setSaving(true);
    const pul = parseInt(pulse);
    await bpLogsTable().add({
      systolic: sys,
      diastolic: dia,
      pulse: isNaN(pul) ? undefined : pul,
      recordedAt: Date.now(),
      dayKey: dayKey(),
      note: note.trim() || undefined,
    });
    navigate(-1);
  }

  return (
    <div>
      <PageHeader title="Log Blood Pressure" back />
      <Card className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Systolic (mmHg)</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input text-2xl"
              placeholder="e.g. 120"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="field-label">Diastolic (mmHg)</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input text-2xl"
              placeholder="e.g. 80"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Pulse (bpm) — optional</label>
          <input
            type="number"
            inputMode="numeric"
            className="field-input"
            placeholder="e.g. 72"
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Note (optional)</label>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. after resting 5 min"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={save}
          disabled={saving || !systolic || !diastolic}
        >
          Save reading
        </button>
      </Card>
    </div>
  );
}
