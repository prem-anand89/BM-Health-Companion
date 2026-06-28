import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';

/** Sticky page header with an optional back button and trailing action. */
export function PageHeader({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="btn-ghost !px-3 !py-2"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
