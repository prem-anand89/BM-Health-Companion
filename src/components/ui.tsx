import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AccentColor } from '../core/module';

/** Shared, dependency-light UI primitives tuned for an elderly-first feel:
 *  large hit areas, generous spacing, high contrast, plain affordances. */

const accentBg: Record<AccentColor, string> = {
  brand: 'bg-brand-50 text-brand-700',
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  sky: 'bg-sky-50 text-sky-700',
  emerald: 'bg-emerald-50 text-emerald-700',
};

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function AccentBadge({
  accent,
  children,
}: {
  accent: AccentColor;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${accentBg[accent]}`}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-3xl text-slate-300">{icon}</div>}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** A tappable card that links somewhere, with an accent badge and chevron. */
export function LinkCard({
  to,
  accent,
  icon,
  title,
  subtitle,
}: {
  to: string;
  accent: AccentColor;
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Link to={to} className="block">
      <div className="card flex items-center gap-4 active:scale-[0.99] transition">
        <AccentBadge accent={accent}>{icon}</AccentBadge>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{title}</p>
          {subtitle && (
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/** A circular progress ring (SVG) — used for adherence on the dashboard. */
export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  label,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-slate-100"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-brand-600"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span className="absolute text-sm font-bold text-slate-700">
          {label}
        </span>
      )}
    </div>
  );
}
