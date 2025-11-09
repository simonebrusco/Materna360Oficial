'use client'

type Tab =
  | 'meu-dia'
  | 'cuidar'
  | 'maternar'
  | 'descobrir'
  | 'eu360'

type TelemetryEvent =
  | 'nav.click'
  | 'mood.checkin'
  | 'todos.add'
  | 'todos.edit'
  | 'todos.remove'
  | 'todos.complete'
  | 'reminder.created'
  | 'reminder.deleted'
  | 'care.appointment_add'
  | 'eu360.summary_view'

type Payload = Record<string, unknown> & { tab?: Tab }

const DEBUG =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === '1'

/**
 * Fire-and-forget telemetry. Must never block UI.
 * In production, this can be wired to your provider (FS, GA4, Segment, etc.).
 * For now, it no-ops unless DEBUG=1 (which logs to console).
 */
export function track(event: TelemetryEvent, payload: Payload = {}): void {
  try {
    // Non-blocking microtask to avoid any UI stall.
    queueMicrotask(() => {
      if (DEBUG) {
        // Minimal, structured log for QA
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', { event, ...payload, t: Date.now() })
      }
      // TODO: P1.5/P2: send to provider here (navigator.sendBeacon or fetch keepalive)
    })
  } catch {
    // Never throw from telemetry
  }
}

export type { TelemetryEvent, Tab, Payload }
