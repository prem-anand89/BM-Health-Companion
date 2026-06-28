import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { modules, collectInsights, collectReminders } from '../core/registry';
import type { Insight } from '../core/module';
import { InsightCard } from '../components/InsightCard';
import { SectionHeader } from '../components/ui';
import { GearIcon } from '../components/icons';
import { permissionStatus, syncReminders } from '../core/notifications';

/**
 * Home dashboard. It is a thin aggregator: it renders each module's own
 * DashboardWidget and the top coach insights. It has no module-specific code,
 * so new modules appear here automatically.
 */
export function Dashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    let active = true;
    collectInsights().then((all) => {
      if (active) setInsights(all.slice(0, 3));
    });
    // Re-arm reminders whenever the dashboard mounts (e.g. app reopened).
    if (permissionStatus() === 'granted') {
      collectReminders().then(syncReminders);
    }
    return () => {
      active = false;
    };
  }, []);

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between pt-2">
        <div>
          <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, d MMMM')}</p>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
        </div>
        <Link to="/settings" aria-label="Settings" className="btn-ghost !px-3 !py-2">
          <GearIcon />
        </Link>
      </header>

      {insights.length > 0 && (
        <section>
          <SectionHeader
            title="Your coach"
            action={
              <Link to="/coach" className="text-sm font-semibold text-brand-700">
                See all
              </Link>
            }
          />
          <div className="space-y-3">
            {insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Today" />
        <div className="space-y-4">
          {modules.map((m) => {
            const Widget = m.DashboardWidget;
            return <Widget key={m.id} />;
          })}
        </div>
      </section>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
