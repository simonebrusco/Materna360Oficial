'use client'

// Unified telemetry typing for Materna360 (non-blocking, SSR-safe)

export type TelemetryEventName =
  // Core
  | 'page_view'
  | 'nav_click'
  // Maternar
  | 'maternar.page_view'
  | 'maternar.card_click'
  // Planner / Meu Dia
  | 'planner.item_add'
  | 'planner.item_done'
  // Mood / Eu360
  | 'mood.checkin'
  // Descobrir
  | 'discover.filter_changed'
  | 'suggestion_saved'
  // Paywall
  | 'paywall.view'
  | 'paywall.click'
  // Gamification / Toasts
  | 'badge.unlocked'
  | 'toast.shown'
  // Care (Cuidar)
  | 'care.appointment_add'
  | 'care.log_add'
  | 'care.view_section'
  // Audio (Breath / Mindfulness)
  | 'audio.select'    // ← NEW
  | 'audio.play'
  | 'audio.pause'
  | 'audio.end'
  | 'audio.seek'
  | 'audio.progress'
  | 'audio.error'
  | 'audio.restart';

type TelemetryEventPayloads = {
  // Core
  'page_view': { path: string; tab?: string };
  'nav_click': { from?: string; to: string };

  // Maternar
  'maternar.page_view': { source?: 'redirect' | 'nav' | 'deeplink' };
  'maternar.card_click': {
    card: 'eu360' | 'cuidar' | 'meu-dia' | 'descobrir' | 'conquistas' | 'planos';
  };

  // Planner / Meu Dia
  'planner.item_add': { id: string; kind: 'task' | 'event' | 'note' };
  'planner.item_done': { id: string; kind: 'task' | 'event' | 'note' };

  // Mood / Eu360
  'mood.checkin': { mood: 'baixa' | 'média' | 'alta'; energy?: 'baixa' | 'média' | 'alta' };

  // Descobrir
  'discover.filter_changed': { key: 'tempo' | 'local' | 'energia' | 'idade'; value: string | number };
  'suggestion_saved': { id: string; list?: 'later' | 'planner' };

  // Paywall
  'paywall.view': { context: string; count?: number; limit?: number };
  'paywall.click': { action: string; context?: string };

  // Gamification / Toasts
  'badge.unlocked': { badge: string };
  'toast.shown': { kind: 'default' | 'success' | 'warning' | 'danger'; message?: string; context?: string };

  // Care (Cuidar)
  'care.appointment_add': {
    tab: 'cuidar';
    type: 'consulta' | 'vacina' | 'exame' | string;
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

  // Audio (Breath / Mindfulness)
  'audio.select': { id: string };                            // ← NEW
  'audio.play': { id: string; allowProgress?: boolean; at?: number }; // at: currentTime (s)
  'audio.pause': { id: string; at?: number };
  'audio.end': { id: string; at?: number };
  'audio.seek': { id: string; from: number; to: number };
  'audio.progress': { id: string; current: number; duration?: number };
  'audio.error': { id?: string; code?: string | number; message?: string };
  'audio.restart': { id: string; at?: number; from?: number };
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
    // No-op: telemetry must never break UI/build
  }
}

export const trackTelemetry = track;
export type { TelemetryEventPayloads as TelemetryPayloads };
