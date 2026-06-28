import type { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { Dexie } from 'dexie';

/**
 * The contract every feature module implements. The registry uses these
 * manifests to assemble navigation, the dashboard, the database schema, and
 * the coach insight feed. Adding a feature = create a manifest + register it.
 * No app-wide redesign required.
 */
export interface HealthModule {
  /** Stable unique id, e.g. 'medications'. Used for routing and insight tags. */
  id: string;
  /** Human title shown in nav and headings. */
  title: string;
  /** Short one-liner describing the module (shown on the modules screen). */
  description: string;
  /** Icon rendered in nav and on cards. */
  icon: ReactNode;
  /** Tailwind-ish accent token used for the module's cards (e.g. 'brand'). */
  accent: AccentColor;
  /** Whether this module appears as a primary bottom-nav tab. */
  primaryNav?: boolean;

  /** The module's own pages, mounted under the app shell. */
  routes: RouteObject[];

  /** Compact summary card shown on the home dashboard. */
  DashboardWidget: ComponentType;

  /**
   * Register the module's Dexie tables. Called once during db setup.
   * Implementations push into the shared schema object.
   */
  registerSchema(schema: Record<string, string>): void;

  /** Bump when this module's tables change; combined into the db version. */
  schemaVersion: number;

  /** Produce the module's coach insights from its stored data. */
  getInsights(): Promise<Insight[]>;

  /** Optional: produce reminders the notification scheduler should fire. */
  getReminders?(): Promise<Reminder[]>;

  /** Optional hook so a module can react to the Dexie instance once ready. */
  onDbReady?(db: Dexie): void;
}

export type AccentColor = 'brand' | 'rose' | 'amber' | 'indigo' | 'sky' | 'emerald';

export type InsightSeverity = 'celebrate' | 'info' | 'nudge' | 'warning';

/**
 * A single piece of coaching surfaced to the user. Deliberately data-shaped so
 * a future LLM/ML layer can emit the same structure without UI changes.
 */
export interface Insight {
  id: string;
  moduleId: string;
  severity: InsightSeverity;
  /** Short headline, plain language. */
  title: string;
  /** Optional supporting sentence. */
  body?: string;
  /** Optional call-to-action: label + route to navigate to. */
  cta?: { label: string; to: string };
  /** Higher = more important; used to order the feed. */
  priority: number;
  createdAt: number;
}

export interface Reminder {
  id: string;
  moduleId: string;
  title: string;
  body?: string;
  /** Epoch ms when this reminder is due. */
  dueAt: number;
}
