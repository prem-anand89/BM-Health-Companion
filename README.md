# BM Health Companion

A **mobile-first, offline-capable, installable PWA** that acts as an intelligent
daily health coach — it *reminds, tracks, analyzes, educates and motivates*
rather than being a checklist. Designed to be simple enough for elderly
patients and architected so each feature is an independent module, so it can
grow into a clinic-wide platform.

> Status: foundation + two core modules (**Medications**, **Symptoms**).
> Remaining modules (supplements, reminders hub, glucose, bowel/Bristol,
> exercise) plug into the same pattern.

## Highlights

- **Offline-first.** All data lives on-device in IndexedDB (Dexie). The app is
  fully usable with no network; a service worker (Workbox via `vite-plugin-pwa`)
  precaches the shell and serves an offline fallback.
- **Installable.** Web app manifest + icons + service worker → "Add to Home
  Screen" on phones, installs as a standalone app.
- **Coach, not checklist.** A transparent, on-device rule engine turns logs into
  plain-language insights (trends, streaks, threshold alerts, gentle
  correlations, education). The insight shape is data-only, so an LLM/ML layer
  can later enrich the same feed.
- **Elderly-first UX.** Large text, high contrast, big tap targets, icon+label
  navigation, minimal typing (sliders, steppers, chips), optional Large-Text and
  High-Contrast modes.
- **Modular by design.** Every feature is a self-contained module. Adding one
  touches a single registry array — no app-wide redesign.

## Tech stack

Vite · React · TypeScript · Tailwind CSS · Dexie (IndexedDB) ·
`vite-plugin-pwa` (Workbox) · React Router · Recharts · date-fns

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build (generates the service worker)
npm run preview    # serve the production build (use this to test PWA install)
```

> The service worker is disabled in `dev` and enabled in the production build.
> Test installability and offline behaviour with `npm run build && npm run preview`.

## Architecture

```
src/
  core/
    module.ts        # HealthModule contract + Insight / Reminder types
    db.ts            # the single shared Dexie database
    registry.ts      # the module list + initDb + insight/reminder aggregation
    insights.ts      # reusable rule helpers (trend, streak, threshold, correlation)
    notifications.ts # Web Notification scheduling for reminders
    dates.ts         # day-key + friendly date helpers
    preferences.ts   # large-text / high-contrast prefs (localStorage)
  components/        # shared UI primitives (Card, ProgressRing, InsightCard, …)
  pages/             # Dashboard, Coach (insight feed), Settings
  modules/
    medications/     # manifest + db + schedule + screens + widget + insights
    symptoms/        # same shape
```

The **dashboard**, **bottom navigation**, **database schema**, **coach feed**
and **reminders** are all assembled from the registry at runtime — none of them
contain module-specific code.

## The module contract

Every feature implements `HealthModule` (`src/core/module.ts`):

```ts
interface HealthModule {
  id: string;                       // 'medications'
  title: string;                    // nav label
  description: string;
  icon: ReactNode;
  accent: AccentColor;
  primaryNav?: boolean;             // show as a bottom-nav tab
  schemaVersion: number;            // bump on table changes
  routes: RouteObject[];            // mounted under /m/<id>
  DashboardWidget: ComponentType;   // summary card on Home
  registerSchema(schema): void;     // contribute Dexie tables
  getInsights(): Promise<Insight[]>;// rule-based coaching
  getReminders?(): Promise<Reminder[]>;
}
```

## How to add a new module (the recipe)

1. **Create a folder** `src/modules/<name>/`.
2. **`db.ts`** — define your tables in a schema object and export typed table
   accessors (see `modules/symptoms/db.ts` for the simplest example).
3. **Screens + widget** — build your pages and a `DashboardWidget`. Reuse the
   shared primitives in `src/components/` and the `useLiveQuery` hook for
   reactive reads.
4. **`insights.ts`** — compute coaching with the helpers in `core/insights.ts`
   (`trend`, `dayStreak`, `crossesThreshold`, `correlation`, `makeInsight`).
5. **`manifest.tsx`** — export a `HealthModule` wiring the above together.
6. **Register it** — add the manifest to the `modules` array in
   `src/core/registry.ts`. That's the only shared file you touch.

Bump `schemaVersion` whenever you change your tables; the database version is
the sum of all modules' versions, so Dexie upgrades cleanly.

## Roadmap

- Modules: supplements, reminders/alarms hub, glucose, bowel (Bristol scale), exercise.
- Clinic-wide sync layer (backend + auth + multi-patient) — the on-device store
  is designed to sync later.
- LLM-powered coaching (Claude API) plugged into the existing `Insight` contract.

## Privacy

All health data stays on the user's device. The "Export my data" button in
Settings produces a JSON copy the patient controls.
