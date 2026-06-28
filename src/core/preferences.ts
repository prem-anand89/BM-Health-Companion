/**
 * Lightweight display preferences persisted to localStorage. Kept separate
 * from app data (which lives in IndexedDB) because these must be applied to
 * <html> synchronously before first paint to avoid a flash.
 */
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type WeightUnit = 'kg' | 'lbs';

export interface DisplayPreferences {
  largeText: boolean;
  highContrast: boolean;
  /** "HH:mm" 24h time for daily symptom check-in notification, or null to disable. */
  symptomReminderTime: string | null;
  /** Unit for blood glucose readings. */
  glucoseUnit: GlucoseUnit;
  /** Target glucose range minimum (mg/dL). */
  glucoseTargetMin: number;
  /** Target glucose range maximum (mg/dL). */
  glucoseTargetMax: number;
  /** Unit for body weight. */
  weightUnit: WeightUnit;
  /** Height in cm for BMI calculation, or null if not set. */
  heightCm: number | null;
}

const KEY = 'bm-health:prefs';

const defaults: DisplayPreferences = {
  largeText: false,
  highContrast: false,
  symptomReminderTime: null,
  glucoseUnit: 'mg/dL',
  glucoseTargetMin: 70,
  glucoseTargetMax: 140,
  weightUnit: 'kg',
  heightCm: null,
};

export function getPreferences(): DisplayPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function setPreferences(prefs: DisplayPreferences): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  apply(prefs);
}

function apply(prefs: DisplayPreferences): void {
  const root = document.documentElement;
  root.classList.toggle('large-text', prefs.largeText);
  root.classList.toggle('high-contrast', prefs.highContrast);
}

/** Called once at startup (from main.tsx) before React renders. */
export function applyStoredPreferences(): void {
  apply(getPreferences());
}
