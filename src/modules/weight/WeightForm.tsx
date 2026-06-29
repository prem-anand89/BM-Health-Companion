import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { weightLogsTable, toKg, calcBMI, bmiCategory, calcWHtR, whtRCategory, whtRColor } from './db';
import { getPreferences } from '../../core/preferences';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

export function WeightForm() {
  const navigate = useNavigate();
  const prefs = getPreferences();
  const { weightUnit, heightCm } = prefs;
  const [value, setValue] = useState('');
  const [waist, setWaist] = useState('');
  const [saving, setSaving] = useState(false);

  // Live calculations
  const kg = toKg(parseFloat(value) || 0, weightUnit);
  const bmiLive = kg > 0 && heightCm ? calcBMI(kg, heightCm) : null;
  const waistNum = parseFloat(waist);
  const whtrLive = waistNum > 0 && heightCm ? calcWHtR(waistNum, heightCm) : null;

  async function save() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    await weightLogsTable().add({
      value: num,
      unit: weightUnit,
      waistCm: waistNum > 0 ? waistNum : undefined,
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

        <div>
          <label className="field-label">Waist circumference (cm) — optional</label>
          <input
            type="number"
            inputMode="decimal"
            className="field-input"
            placeholder="e.g. 85"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
          />
        </div>

        {/* Live preview panel */}
        {(bmiLive !== null || whtrLive !== null) && (
          <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Calculated</p>
            {bmiLive !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">BMI</span>
                <span className="font-bold text-slate-800">
                  {bmiLive.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-500">({bmiCategory(bmiLive)})</span>
                </span>
              </div>
            )}
            {whtrLive !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Waist-to-height ratio</span>
                <span className={`font-bold ${whtRColor(whtrLive)}`}>
                  {whtrLive.toFixed(2)}{' '}
                  <span className="text-xs font-normal">({whtRCategory(whtrLive)})</span>
                </span>
              </div>
            )}
            {!heightCm && (
              <p className="text-xs text-slate-400">Set your height in Settings to see these values.</p>
            )}
          </div>
        )}

        {!heightCm && value && (
          <p className="text-xs text-slate-400 text-center">
            Add your height in Settings → Health Units to auto-calculate BMI & WHtR.
          </p>
        )}

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
