'use client'

// Unified telemetry typing for Materna360 (non-blocking, SSR-safe)

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
  | 'toast.shown'
  // --- Care (Cuidar) events
  | 'care.appointment_add'
  | 'care.log_add'
  | 'care.view_section';

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

  // --- Care (Cuidar)
  'care.appointment_add': {
    tab: 'cuidar';
    type: 'consulta' | 'vacina' | 'exame' | string; // flexible
    date: string; // ISO or yyyy-mm-dd
  };
  'care.log_add': {
    tab: 'cuidar';
    kind: 'alimentacao' | 'sono' | 'humor' | string;
    value?: string | number;
    at?: string; // ISO timestamp (optional)
  };
  'care.view_section': {
    tab: 'cuidar';
    section: 'timeline' | 'vacinas' | 'consultas' | 'registros' | string;
  };
};

export function track<E extends TelemetryEventName>(
  name: E,
  payload: TelemetryEventPayloads[E]
): void {
  try {
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', name, payload);
      }
      window.dispatchEvent(
        new CustomEvent('m360:telemetry', {
          detail: { name, payload, ts: Date.now() },
        })
      );
    } else {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[telemetry][server]', name, payload);
      }
    }
  } catch {
    // no-op: telemetry must never break UI/build
  }
}

export const trackTelemetry = track;
export type { TelemetryEventPayloads as TelemetryPayloads };
