/**
 * Lightweight display preferences persisted to localStorage. Kept separate
 * from app data (which lives in IndexedDB) because these must be applied to
 * <html> synchronously before first paint to avoid a flash.
 */
export interface DisplayPreferences {
  largeText: boolean;
  highContrast: boolean;
  /** "HH:mm" 24h time for daily symptom check-in notification, or null to disable. */
  symptomReminderTime: string | null;
}

const KEY = 'bm-health:prefs';

const defaults: DisplayPreferences = {
  largeText: false,
  highContrast: false,
  symptomReminderTime: null,
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
