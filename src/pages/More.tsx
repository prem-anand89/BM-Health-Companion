import { useState } from 'react';
import { Link } from 'react-router-dom';
import { modules } from '../core/registry';
import { getPreferences, setPreferences, resolvePinned } from '../core/preferences';
import { PageHeader } from '../components/PageHeader';
import { AccentBadge } from '../components/ui';
import { StarIcon, ChevronRightIcon } from '../components/icons';

/**
 * All trackers in one place. Pinned modules appear on Home; everything else
 * lives here. A caregiver can pin/unpin per patient via the star toggle — the
 * choice persists in prefs (plan items B/§2.2–2.3).
 */
export function More() {
  const [pinned, setPinned] = useState<string[]>(() => resolvePinned(getPreferences()));

  function togglePin(id: string) {
    const next = pinned.includes(id)
      ? pinned.filter((x) => x !== id)
      : [...pinned, id];
    setPinned(next);
    setPreferences({ ...getPreferences(), pinnedModules: next });
  }

  return (
    <div>
      <PageHeader title="All trackers" back />
      <p className="mb-4 px-1 text-sm text-slate-500">
        Tap a tracker to open it. Tap the star to show it on your Home screen.
      </p>

      <ul className="space-y-3">
        {modules.map((m) => {
          const isPinned = pinned.includes(m.id);
          return (
            <li key={m.id} className="flex items-center gap-2">
              <Link to={`/m/${m.id}`} className="block min-w-0 flex-1">
                <div className="card flex items-center gap-4 active:scale-[0.99] transition">
                  <AccentBadge accent={m.accent}>{m.icon}</AccentBadge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{m.title}</p>
                    <p className="truncate text-sm text-slate-500">{m.description}</p>
                  </div>
                  <ChevronRightIcon className="text-slate-300" />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => togglePin(m.id)}
                aria-label={isPinned ? `Unpin ${m.title} from Home` : `Pin ${m.title} to Home`}
                aria-pressed={isPinned}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                  isPinned ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <StarIcon filled={isPinned} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
