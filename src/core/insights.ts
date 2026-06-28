import type { Insight, InsightSeverity } from './module';

/**
 * Shared, transparent rule-based analyzers used by every module to turn raw
 * logs into plain-language coaching. These deliberately return primitive
 * results (not UI) so modules can compose them, and so a future LLM/ML layer
 * could replace or augment them behind the same `Insight` shape.
 */

let counter = 0;
/** Build an Insight with sensible defaults and a unique id. */
export function makeInsight(
  partial: Omit<Insight, 'id' | 'createdAt' | 'priority'> &
    Partial<Pick<Insight, 'priority'>>,
): Insight {
  return {
    id: `${partial.moduleId}-${Date.now()}-${counter++}`,
    createdAt: Date.now(),
    priority: priorityForSeverity(partial.severity),
    ...partial,
  };
}

function priorityForSeverity(s: InsightSeverity): number {
  switch (s) {
    case 'warning':
      return 100;
    case 'nudge':
      return 60;
    case 'celebrate':
      return 40;
    case 'info':
      return 20;
  }
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendResult {
  direction: TrendDirection;
  /** Signed change between the two halves of the window, in raw units. */
  delta: number;
  /** Mean of the recent half. */
  recentMean: number;
  /** Mean of the earlier half. */
  earlierMean: number;
}

/**
 * Compare the mean of the most recent half of a numeric series against the
 * earlier half. Positive delta = increasing. `flatThreshold` suppresses noise.
 */
export function trend(values: number[], flatThreshold = 0.5): TrendResult {
  if (values.length < 2) {
    const m = values[0] ?? 0;
    return { direction: 'flat', delta: 0, recentMean: m, earlierMean: m };
  }
  const mid = Math.ceil(values.length / 2);
  const earlier = values.slice(0, mid);
  const recent = values.slice(mid);
  const earlierMean = mean(earlier);
  const recentMean = mean(recent);
  const delta = recentMean - earlierMean;
  const direction: TrendDirection =
    Math.abs(delta) < flatThreshold ? 'flat' : delta > 0 ? 'up' : 'down';
  return { direction, delta, recentMean, earlierMean };
}

/**
 * Count consecutive days satisfying a predicate, walking backwards from today.
 * `dateKeys` is the set of day keys (yyyy-MM-dd) on which the condition held.
 */
export function dayStreak(
  satisfiedDays: Set<string>,
  todayKey: string,
  dayKeyOffset: (key: string, daysAgo: number) => string,
): number {
  let streak = 0;
  while (satisfiedDays.has(dayKeyOffset(todayKey, streak))) {
    streak++;
  }
  return streak;
}

/** True when `value` crosses a threshold in the given direction. */
export function crossesThreshold(
  value: number,
  threshold: number,
  direction: 'above' | 'below',
): boolean {
  return direction === 'above' ? value > threshold : value < threshold;
}

/**
 * Pearson-style correlation between two equal-length numeric series, returned
 * in [-1, 1]. Used for gentle "these two things may be related" hints — never
 * presented as medical causation.
 */
export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const ma = mean(ax);
  const mb = mean(bx);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = ax[i] - ma;
    const y = bx[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : num / denom;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Sort a combined insight feed: highest priority, then newest. */
export function rankInsights(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => b.priority - a.priority || b.createdAt - a.createdAt,
  );
}
