import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { primaryNavModules } from '../core/registry';
import { HomeIcon, LightbulbIcon } from './icons';

interface Tab {
  to: string;
  label: string;
  icon: ReactNode;
}

/** App shell: scrollable content area + fixed bottom tab bar. The tab bar is
 *  assembled from the registry so installing a primary module adds a tab with
 *  no edits here. */
export function Layout() {
  const tabs: Tab[] = [
    { to: '/', label: 'Home', icon: <HomeIcon /> },
    ...primaryNavModules().map((m) => ({
      to: `/m/${m.id}`,
      label: m.title,
      icon: m.icon,
    })),
    { to: '/coach', label: 'Coach', icon: <LightbulbIcon /> },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-4 pb-28 pt-2">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex items-stretch justify-around">
          {tabs.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-medium transition ${
                    isActive ? 'text-brand-700' : 'text-slate-400'
                  }`
                }
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
