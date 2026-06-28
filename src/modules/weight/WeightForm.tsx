import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { weightLogsTable } from './db';
import { getPreferences } from '../../core/preferences';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

export function WeightForm() {
  const navigate = useNavigate();
  const { weightUnit } = getPreferences();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    await weightLogsTable().add({
      value: num,
      unit: weightUnit,
      recordedAt: Date.now(),
      dayKey: dayKey(),
    });
    navigate(-1);
  }

  return (
    <div>
      <PageHeader title="Log Weight" back />
      <Card className="space-y-5">
        <div>
          <label className="field-label">Weight ({weightUnit})</label>
          <input
            type="number"
            inputMode="decimal"
            className="field-input text-3xl"
            placeholder={weightUnit === 'lbs' ? 'e.g. 165' : 'e.g. 75'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={save}
          disabled={saving || !value}
        >
          Save weight
        </button>
      </Card>
    </div>
  );
}
