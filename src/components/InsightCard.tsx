import { Link } from 'react-router-dom';
import type { Insight, InsightSeverity } from '../core/module';
import { ChevronRightIcon } from './icons';

const style: Record<
  InsightSeverity,
  { ring: string; chip: string; emoji: string }
> = {
  celebrate: { ring: 'border-emerald-200', chip: 'bg-emerald-100 text-emerald-700', emoji: '🎉' },
  info: { ring: 'border-slate-200', chip: 'bg-slate-100 text-slate-600', emoji: '💡' },
  nudge: { ring: 'border-amber-200', chip: 'bg-amber-100 text-amber-700', emoji: '👋' },
  warning: { ring: 'border-rose-200', chip: 'bg-rose-100 text-rose-700', emoji: '⚠️' },
};

/** Renders a single coach insight. Same component on the dashboard and feed. */
export function InsightCard({ insight }: { insight: Insight }) {
  const s = style[insight.severity];
  return (
    <div className={`card border ${s.ring}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {s.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{insight.title}</p>
          {insight.body && (
            <p className="mt-1 text-sm text-slate-600">{insight.body}</p>
          )}
          {insight.cta && (
            <Link
              to={insight.cta.to}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
            >
              {insight.cta.label}
              <ChevronRightIcon className="!h-4 !w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
