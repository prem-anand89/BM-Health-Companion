import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { modules, collectReminders } from '../core/registry';
import type { Reminder } from '../core/module';
import { SectionHeader } from '../components/ui';
import { GearIcon, CalendarIcon, ClipboardIcon, BellIcon } from '../components/icons';
import { permissionStatus, syncReminders } from '../core/notifications';

export function Dashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    let active = true;
    collectReminders().then((all) => {
      if (!active) return;
      const upcoming = all
        .filter((r) => r.dueAt >= Date.now() - 60 * 60_000)
        .sort((a, b) => a.dueAt - b.dueAt);
      setReminders(upcoming);
      if (permissionStatus() === 'granted') syncReminders(all);
    });
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

      <section>
        <SectionHeader title="Reminders" />
        {reminders.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-4 py-5 text-slate-500">
            <BellIcon className="text-slate-300" />
            <p className="text-sm">You're all caught up — nothing due right now.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reminders.map((r) => (
              <ReminderRow key={r.id} reminder={r} />
            ))}
          </ul>
        )}
      </section>

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

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const overdue = reminder.dueAt < Date.now();
  return (
    <li>
      <Link
        to={`/m/${reminder.moduleId}`}
        className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm active:scale-[0.99] transition"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            overdue ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-700'
          }`}
        >
          <BellIcon className="!h-5 !w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{reminder.title}</p>
          {reminder.body && (
            <p className="truncate text-sm text-slate-500">{reminder.body}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-sm font-bold ${
            overdue ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          {format(new Date(reminder.dueAt), 'h:mm a')}
        </span>
      </Link>
    </li>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
