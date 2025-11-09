'use client'

export type TelemetryEventName =
  | 'page_view'
  | 'nav_click'
  | 'maternar.page_view'
  | 'maternar.card_click'
  | 'planner.item_add'
  | 'planner.item_done'
  | 'mood.checkin'
  | 'discover.filter_changed'
  | 'suggestion_saved'
  | 'paywall.view'
  | 'paywall.click'
  | 'badge.unlocked'
  | 'toast.shown';

type TelemetryEventPayloads = {
  'page_view': { path: string; tab?: string };
  'nav_click': { from?: string; to: string };
  'maternar.page_view': { source?: 'redirect' | 'nav' | 'deeplink' };
  'maternar.card_click': {
    card: 'eu360' | 'cuidar' | 'meu-dia' | 'descobrir' | 'conquistas' | 'planos';
  };
  'planner.item_add': { id: string; kind: 'task' | 'event' | 'note' };
  'planner.item_done': { id: string; kind: 'task' | 'event' | 'note' };
  'mood.checkin': { mood: 'baixa' | 'média' | 'alta'; energy?: 'baixa' | 'média' | 'alta' };
  'discover.filter_changed': { key: 'tempo' | 'local' | 'energia' | 'idade'; value: string | number };
  'suggestion_saved': { id: string; list?: 'later' | 'planner' };
  'paywall.view': { context: string; count?: number; limit?: number };
  'paywall.click': { action: string; context?: string };
  'badge.unlocked': { badge: string };
  'toast.shown': { kind: 'default' | 'success' | 'warning' | 'danger'; message?: string; context?: string };
};

export function track<E extends TelemetryEventName>(
  name: E,
  payload: TelemetryEventPayloads[E]
): void {
  try {
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[telemetry]', name, payload);
      }
      window.dispatchEvent(
        new CustomEvent('m360:telemetry', {
          detail: { name, payload, ts: Date.now() },
        })
      );
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[telemetry][server]', name, payload);
      }
    }
  } catch {
    // No-op
  }
}

export const trackTelemetry = track;
export type { TelemetryEventPayloads as TelemetryPayloads };
