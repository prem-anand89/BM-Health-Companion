import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  exerciseLogsTable,
  EXERCISE_TYPES,
  EXERCISE_INTENSITIES,
  type ExerciseType,
  type ExerciseIntensity,
} from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';

export function ExerciseForm() {
  const navigate = useNavigate();
  const [type, setType] = useState<ExerciseType>('walk');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<ExerciseIntensity>('moderate');
  const [steps, setSteps] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const dur = parseInt(duration);
    if (isNaN(dur) || dur <= 0) return;
    setSaving(true);
    const stepsNum = parseInt(steps);
    await exerciseLogsTable().add({
      type,
      duration: dur,
      intensity,
      steps: isNaN(stepsNum) ? undefined : stepsNum,
      recordedAt: Date.now(),
      dayKey: dayKey(),
      note: note.trim() || undefined,
    });
    navigate(-1);
  }

  return (
    <div>
      <PageHeader title="Log Exercise" back />
      <Card className="space-y-5">
        <div>
          <label className="field-label">Activity type</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {EXERCISE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  type === t.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Duration (minutes)</label>
          <input
            type="number"
            inputMode="numeric"
            className="field-input text-2xl"
            placeholder="30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Intensity</label>
          <div className="space-y-2 mt-1">
            {EXERCISE_INTENSITIES.map((i) => (
              <button
                key={i.value}
                type="button"
                onClick={() => setIntensity(i.value)}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                  intensity === i.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <span className="font-semibold">{i.label}</span>
                <span className={intensity === i.value ? 'text-amber-100' : 'text-amber-600'}>
                  {i.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Steps (optional)</label>
          <input
            type="number"
            inputMode="numeric"
            className="field-input"
            placeholder="e.g. 6000"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Note (optional)</label>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. morning park walk"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={save}
          disabled={saving || !duration}
        >
          Save activity
        </button>
      </Card>
    </div>
  );
}
