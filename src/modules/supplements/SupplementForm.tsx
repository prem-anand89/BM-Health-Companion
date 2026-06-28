import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supplementsTable, type SupplementForm as SuppForm, type Supplement } from './db';
import { dayKey } from '../../core/dates';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui';
import { PlusIcon } from '../../components/icons';

const FORMS: SuppForm[] = ['tablet', 'capsule', 'softgel', 'powder', 'liquid', 'gummy', 'other'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function SupplementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id != null;

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [form, setForm] = useState<SuppForm>('capsule');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(dayKey());
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(!editing);

  useEffect(() => {
    if (!editing) return;
    supplementsTable()
      .get(Number(id))
      .then((s) => {
        if (!s) return;
        setName(s.name);
        setDose(s.dose);
        setForm(s.form);
        setTimes(s.times.length ? s.times : ['08:00']);
        setDaysOfWeek(s.daysOfWeek);
        setStartDate(s.startDate);
        setEndDate(s.endDate ?? '');
        setQuantity(s.quantityRemaining?.toString() ?? '');
        setNotes(s.notes ?? '');
        setLoaded(true);
      });
  }, [editing, id]);

  function setTime(i: number, value: string) {
    setTimes((t) => t.map((v, idx) => (idx === i ? value : v)));
  }
  function addTime() { setTimes((t) => [...t, '20:00']); }
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
    const fields: Omit<Supplement, 'createdAt'> = {
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
      await supplementsTable().update(Number(id), fields);
    } else {
      await supplementsTable().add({ ...fields, createdAt: Date.now() });
    }
    navigate('/m/supplements');
  }

  async function archive() {
    if (!editing) return;
    await supplementsTable().update(Number(id), { archived: true });
    navigate('/m/supplements/list');
  }

  if (!loaded) return null;

  return (
    <div>
      <PageHeader title={editing ? 'Edit supplement' : 'Add supplement'} back />

      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input
              className="field-input"
              placeholder="e.g. Vitamin D3"
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
                placeholder="e.g. 1000 IU"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Form</label>
              <select
                className="field-input"
                value={form}
                onChange={(e) => setForm(e.target.value as SuppForm)}
              >
                {FORMS.map((f) => (
                  <option key={f} value={f}>{f}</option>
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
                  <button className="btn-ghost !px-3" onClick={() => removeTime(i)} aria-label="Remove time">
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
                    active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
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
            <label className="field-label">Quantity remaining (optional)</label>
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
          {editing ? 'Save changes' : 'Add supplement'}
        </button>

        {editing && (
          <button className="btn-ghost w-full !text-rose-600" onClick={archive}>
            Remove supplement
          </button>
        )}
      </div>
    </div>
  );
}
