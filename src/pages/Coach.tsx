import { useEffect, useState } from 'react';
import { collectInsights } from '../core/registry';
import type { Insight } from '../core/module';
import { InsightCard } from '../components/InsightCard';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/ui';
import { SparkIcon } from '../components/icons';

/**
 * The full coach feed: every module's insights, ranked. This is the "analyze /
 * predict / educate / motivate" surface. Today the insights are rule-based and
 * computed on-device; the same feed can later be enriched by an LLM without
 * changing this page.
 */
export function Coach() {
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    let active = true;
    collectInsights().then((all) => {
      if (active) setInsights(all);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Your health coach"
        subtitle="Personalised insights from your logs"
      />

      {insights === null ? (
        <p className="px-1 text-sm text-slate-400">Thinking…</p>
      ) : insights.length === 0 ? (
        <EmptyState
          icon={<SparkIcon />}
          title="No insights yet"
          body="Log your medications and how you feel for a few days. Your coach will spot trends, streaks and things to watch."
        />
      ) : (
        <div className="space-y-3">
          {insights.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      )}
    </div>
  );
}
