'use client'

// Unified telemetry typing for Materna360 (non-blocking, SSR-safe)
// Now tolerant to extra payload keys via WithExtra<T>.

type WithExtra<T> = T & { [key: string]: unknown };

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
  | 'audio.select'
  | 'audio.play'
  | 'audio.pause'
  | 'audio.end'
  | 'audio.seek'
  | 'audio.progress'
  | 'audio.error'
  | 'audio.restart';

type TelemetryEventPayloads = {
  // Core
  'page_view': WithExtra<{ path: string; tab?: string }>;
  'nav_click': WithExtra<{ from?: string; to: string }>;

  // Maternar
  'maternar.page_view': WithExtra<{ source?: 'redirect' | 'nav' | 'deeplink' }>;
  'maternar.card_click': WithExtra<{
    card: 'eu360' | 'cuidar' | 'meu-dia' | 'descobrir' | 'conquistas' | 'planos';
  }>;

  // Planner / Meu Dia
  'planner.item_add': WithExtra<{ id: string; kind: 'task' | 'event' | 'note' | string }>;
  'planner.item_done': WithExtra<{ id: string; kind: 'task' | 'event' | 'note' | string }>;

  // Mood / Eu360
  'mood.checkin': WithExtra<{ mood: 'baixa' | 'média' | 'alta' | string; energy?: 'baixa' | 'média' | 'alta' | string }>;

  // Descobrir
  'discover.filter_changed': WithExtra<{ key: 'tempo' | 'local' | 'energia' | 'idade' | string; value: string | number }>;
  'suggestion_saved': WithExtra<{ id: string; list?: 'later' | 'planner' | string }>;

  // Paywall
  'paywall.view': WithExtra<{ context: string; count?: number; limit?: number }>;
  'paywall.click': WithExtra<{ action: string; context?: string }>;

  // Gamification / Toasts
  'badge.unlocked': WithExtra<{ badge: string }>;
  'toast.shown': WithExtra<{ kind: 'default' | 'success' | 'warning' | 'danger' | string; message?: string; context?: string }>;

  // Care (Cuidar)
  'care.appointment_add': WithExtra<{
    tab: 'cuidar';
    type?: string;   // keep flexible
    date?: string;   // ISO or yyyy-mm-dd
  }>;
  'care.log_add': WithExtra<{
    tab: 'cuidar';
    kind: 'alimentacao' | 'sono' | 'humor' | string;
    value?: string | number;
    at?: string; // ISO timestamp (optional)
  }>;
  'care.view_section': WithExtra<{
    tab: 'cuidar';
    section: 'timeline' | 'vacinas' | 'consultas' | 'registros' | string;
  }>;

  // Audio (Breath / Mindfulness)
  'audio.select': WithExtra<{ id: string }>;
  'audio.play': WithExtra<{ id: string; allowProgress?: boolean; at?: number }>;
  'audio.pause': WithExtra<{ id: string; at?: number }>;
  'audio.end': WithExtra<{ id: string; at?: number }>;
  'audio.seek': WithExtra<{ id: string; from: number; to: number }>;
  'audio.progress': WithExtra<{ id: string; current: number; duration?: number }>;
  'audio.error': WithExtra<{ id?: string; code?: string | number; message?: string }>;
  'audio.restart': WithExtra<{ id: string; at?: number; from?: number }>;
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
