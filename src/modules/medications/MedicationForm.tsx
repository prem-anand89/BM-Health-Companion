import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { medicationsTable, type MedForm, type Medication } from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PlusIcon } from '../../components/icons';

const FORMS: MedForm[] = ['tablet', 'capsule', 'liquid', 'injection', 'other'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Add or edit a medication. Minimal typing: steppers, chips and presets keep
 *  it friendly for less technical users. */
export function MedicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id != null;

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [form, setForm] = useState<MedForm>('tablet');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(dayKey());
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(!editing);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [dupName, setDupName] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    medicationsTable()
      .get(Number(id))
      .then((m) => {
        if (!m) return;
        setName(m.name);
        setDose(m.dose);
        setForm(m.form);
        setTimes(m.times.length ? m.times : ['08:00']);
        setDaysOfWeek(m.daysOfWeek);
        setStartDate(m.startDate);
        setEndDate(m.endDate ?? '');
        setQuantity(m.quantityRemaining?.toString() ?? '');
        setNotes(m.notes ?? '');
        setLoaded(true);
      });
  }, [editing, id]);

  function setTime(i: number, value: string) {
    setTimes((t) => t.map((v, idx) => (idx === i ? value : v)));
  }
  function addTime() {
    setTimes((t) => [...t, '20:00']);
  }
  function removeTime(i: number) {
    setTimes((t) => (t.length > 1 ? t.filter((_, idx) => idx !== i) : t));
  }
  function toggleDay(d: number) {
    setDaysOfWeek((days) =>
      days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort(),
    );
  }

  async function save() {
    if (!name.trim()) return;
    // Soft duplicate check on new entries — easy to double-add on a shared
    // family device. Warn, don't block (plan item J / §4.4).
    if (!editing) {
      const trimmed = name.trim().toLowerCase();
      const clash = (await medicationsTable().toArray()).some(
        (m) => !m.archived && m.name.trim().toLowerCase() === trimmed,
      );
      if (clash) {
        setDupName(name.trim());
        return;
      }
    }
    await persist();
  }

  async function persist() {
    const fields: Omit<Medication, 'createdAt'> = {
      name: name.trim(),
      dose: dose.trim(),
      form,
      times: [...new Set(times)].sort(),
      daysOfWeek,
      startDate,
      endDate: endDate || undefined,
      quantityRemaining: quantity ? Number(quantity) : undefined,
      notes: notes.trim() || undefined,
    };
    if (editing) {
      await medicationsTable().update(Number(id), fields);
    } else {
      await medicationsTable().add({ ...fields, createdAt: Date.now() });
    }
    navigate('/m/medications');
  }

  async function archive() {
    if (!editing) return;
    await medicationsTable().update(Number(id), { archived: true });
    navigate('/m/medications/list');
  }

  if (!loaded) return null;

  return (
    <div>
      <PageHeader title={editing ? 'Edit medication' : 'Add medication'} back />

      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input
              className="field-input"
              placeholder="e.g. Metformin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus={!editing}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Dose</label>
              <input
                className="field-input"
                placeholder="e.g. 500 mg"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Form</label>
              <select
                className="field-input"
                value={form}
                onChange={(e) => setForm(e.target.value as MedForm)}
              >
                {FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <label className="field-label">Times of day</label>
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  className="field-input flex-1"
                  value={t}
                  onChange={(e) => setTime(i, e.target.value)}
                />
                {times.length > 1 && (
                  <button
                    className="btn-ghost !px-3"
                    onClick={() => removeTime(i)}
                    aria-label="Remove time"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="btn-ghost w-full" onClick={addTime}>
            <PlusIcon className="!h-5 !w-5" /> Add another time
          </button>
        </Card>

        <Card className="space-y-3">
          <label className="field-label">Days (leave all off for every day)</label>
          <div className="flex justify-between gap-1">
            {DAY_LABELS.map((label, d) => {
              const active = daysOfWeek.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`h-11 w-11 rounded-full text-sm font-semibold transition ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Start date</label>
              <input
                type="date"
                className="field-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">End date (optional)</label>
              <input
                type="date"
                className="field-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Pills/doses remaining (optional)</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input"
              placeholder="for refill reminders"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Notes (optional)</label>
            <textarea
              className="field-input"
              rows={2}
              placeholder="e.g. take with food"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        <button className="btn-primary w-full" onClick={save} disabled={!name.trim()}>
          {editing ? 'Save changes' : 'Add medication'}
        </button>

        {editing && (
          <button
            className="btn-ghost w-full !text-rose-600"
            onClick={() => setConfirmRemove(true)}
          >
            Remove medication
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title={`Remove ${name || 'this medication'}?`}
        body="It will be moved to Archived, where you can restore it later."
        confirmLabel="Remove"
        onConfirm={archive}
        onCancel={() => setConfirmRemove(false)}
      />

      <ConfirmDialog
        open={dupName != null}
        danger={false}
        title={`You already have ${dupName}`}
        body="A medication with this name already exists. Add it anyway?"
        confirmLabel="Add anyway"
        onConfirm={() => {
          setDupName(null);
          persist();
        }}
        onCancel={() => setDupName(null)}
      />
    </div>
  );
}
