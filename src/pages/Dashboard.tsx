import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { modules, collectReminders } from '../core/registry';
import { SectionHeader } from '../components/ui';
import { GearIcon, CalendarIcon, ClipboardIcon } from '../components/icons';
import { permissionStatus, syncReminders } from '../core/notifications';

export function Dashboard() {
  useEffect(() => {
    if (permissionStatus() === 'granted') {
      collectReminders().then(syncReminders);
    }
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

      <section>
        <SectionHeader title="Today" />
        <div className="space-y-4">
          {modules.map((m) => {
            const Widget = m.DashboardWidget;
            return <Widget key={m.id} />;
          })}
        </div>
      </section>

      <section>
        <SectionHeader title="Tools" />
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/history"
            className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm active:scale-95 transition"
          >
            <CalendarIcon className="text-brand-600" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">History</p>
              <p className="text-xs text-slate-500">Any day's log</p>
            </div>
          </Link>
          <Link
            to="/report"
            className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm active:scale-95 transition"
          >
            <ClipboardIcon className="text-brand-600" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">Report</p>
              <p className="text-xs text-slate-500">Weekly summary</p>
            </div>
          </Link>
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
