import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionHeader } from '../components/ui';
import {
  getPreferences,
  setPreferences,
  type DisplayPreferences,
  type GlucoseUnit,
  type WeightUnit,
} from '../core/preferences';
import {
  permissionStatus,
  requestPermission,
  notificationsSupported,
  triggersSupported,
} from '../core/notifications';
import { collectReminders, modules } from '../core/registry';
import { syncReminders } from '../core/notifications';
import { db } from '../core/db';

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-sm text-slate-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          checked ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </label>
  );
}

export function Settings() {
  const [prefs, setPrefsState] = useState<DisplayPreferences>(getPreferences());
  const [perm, setPerm] = useState<NotificationPermission>(permissionStatus());

  function update(next: Partial<DisplayPreferences>) {
    const merged = { ...prefs, ...next };
    setPrefsState(merged);
    setPreferences(merged);
  }

  async function enableNotifications() {
    const result = await requestPermission();
    setPerm(result);
    if (result === 'granted') {
      const reminders = await collectReminders();
      syncReminders(reminders);
    }
  }

  async function updateSymptomReminder(time: string) {
    const next = { ...prefs, symptomReminderTime: time || null };
    setPrefsState(next);
    setPreferences(next);
    if (perm === 'granted') {
      const reminders = await collectReminders();
      syncReminders(reminders);
    }
  }

  async function exportData() {
    const dump: Record<string, unknown> = { exportedAt: new Date().toISOString() };
    for (const m of modules) {
      const stores: Record<string, string> = {};
      m.registerSchema(stores);
      for (const table of Object.keys(stores)) {
        dump[table] = await db.t(table).toArray();
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    update({ lastExportAt: Date.now() });
  }

  return (
    <div>
      <PageHeader title="Settings" back />

      <SectionHeader title="Display" />
      <Card className="!py-1 divide-y divide-slate-100">
        <Toggle
          label="Large text"
          hint="Bigger text across the whole app"
          checked={prefs.largeText}
          onChange={(v) => update({ largeText: v })}
        />
        <Toggle
          label="High contrast"
          hint="Stronger colours for easier reading"
          checked={prefs.highContrast}
          onChange={(v) => update({ highContrast: v })}
        />
      </Card>

      <div className="mt-6">
        <SectionHeader title="Reminders" />
        <Card className="space-y-4">
          {!notificationsSupported() ? (
            <p className="text-sm text-slate-500">
              Notifications are not supported on this device.
            </p>
          ) : perm === 'denied' ? (
            <p className="text-sm text-slate-500">
              Reminders are blocked. Enable notifications for this app in your
              browser settings to turn them back on.
            </p>
          ) : perm !== 'granted' ? (
            <>
              <p className="text-sm text-slate-600">
                Get a gentle reminder when a dose or check-in is due.
              </p>
              <button className="btn-primary" onClick={enableNotifications}>
                Turn on reminders
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-emerald-700">
                ✓ Reminders are on — you'll be nudged when something is due.
              </p>

              <div className="border-t border-slate-100 pt-4">
                <label className="field-label">Medication reminders</label>
                <p className="text-sm text-slate-500">
                  Automatic — fires at each scheduled medication time.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="field-label">Daily symptom check-in</label>
                <p className="mb-2 text-sm text-slate-500">
                  Pick a daily time to be reminded to log how you feel.
                </p>
                <input
                  type="time"
                  className="field-input"
                  value={prefs.symptomReminderTime ?? ''}
                  onChange={(e) => updateSymptomReminder(e.target.value)}
                />
                {prefs.symptomReminderTime && (
                  <button
                    className="mt-2 text-sm text-rose-600"
                    onClick={() => updateSymptomReminder('')}
                  >
                    Remove check-in reminder
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
        {!triggersSupported() && (
          <p className="mt-2 px-1 text-xs text-slate-400">
            On this device, reminders fire reliably only while the app is open in
            the background. Keep it open (or installed to your home screen) so you
            don't miss a dose.
          </p>
        )}
      </div>

      <div className="mt-6">
        <SectionHeader title="Health Units" />
        <Card className="space-y-4">
          <div>
            <label className="field-label">Blood glucose unit</label>
            <div className="mt-1 flex gap-2">
              {(['mg/dL', 'mmol/L'] as GlucoseUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => update({ glucoseUnit: u })}
                  className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition ${
                    prefs.glucoseUnit === u ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="field-label">Glucose target range (mg/dL)</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="number"
                className="field-input flex-1"
                placeholder="Min (e.g. 70)"
                value={prefs.glucoseTargetMin}
                onChange={(e) => update({ glucoseTargetMin: Number(e.target.value) || 70 })}
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                className="field-input flex-1"
                placeholder="Max (e.g. 140)"
                value={prefs.glucoseTargetMax}
                onChange={(e) => update({ glucoseTargetMax: Number(e.target.value) || 140 })}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="field-label">Weight unit</label>
            <div className="mt-1 flex gap-2">
              {(['kg', 'lbs'] as WeightUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => update({ weightUnit: u })}
                  className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition ${
                    prefs.weightUnit === u ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="field-label">Height (cm) — for BMI calculation</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input mt-1"
              placeholder="e.g. 170"
              value={prefs.heightCm ?? ''}
              onChange={(e) => update({ heightCm: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionHeader title="Your data" />
        <Card>
          <p className="mb-3 text-sm text-slate-600">
            All your data stays on this device. Export a copy to keep or to share
            with your clinic.
          </p>
          <button className="btn-ghost" onClick={exportData}>
            Export my data (JSON)
          </button>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        BM Health Companion · works offline · v0.1
      </p>
    </div>
  );
}
