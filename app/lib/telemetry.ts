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
  | 'care.log_add'
  | 'eu360.summary_view'
  | 'eu360.diary_add'
  | 'planner.item_add'
  | 'planner.item_done'
  | 'discover.suggestion_started'
  | 'discover.suggestion_saved'
  | 'discover.filter_changed'
  | 'paywall.view'
  | 'paywall.click'

type Payload = Record<string, unknown> & { tab?: Tab }

type TelemetryContext = {
  event?: string
  tab?: Tab
  component?: string
  action?: string
  id?: string
  payload?: Record<string, unknown>
  timestamp?: number
}

const DEBUG =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === '1'

let telemetryProvider: ((ctx: TelemetryContext) => void) | null = null

/**
 * Set a custom telemetry provider (FS, GA4, Segment, etc.)
 */
export function setTelemetryProvider(provider: (ctx: TelemetryContext) => void): void {
  telemetryProvider = provider
}

/**
 * Fire-and-forget telemetry. Must never block UI.
 * In production, this can be wired to your provider (FS, GA4, Segment, etc.).
 * For now, it no-ops unless DEBUG=1 (which logs to console).
 */
export function track(event: TelemetryEvent, payload: Payload = {}): void {
  try {
    // Non-blocking microtask to avoid any UI stall.
    queueMicrotask(() => {
      const ctx: TelemetryContext = { event, ...payload, timestamp: Date.now() }
      if (telemetryProvider) {
        telemetryProvider(ctx)
      }
      if (DEBUG) {
        // Minimal, structured log for QA
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', ctx)
      }
      // TODO: P1.5/P2: send to provider here (navigator.sendBeacon or fetch keepalive)
    })
  } catch {
    // Never throw from telemetry
  }
}

/**
 * Backward-compatible alias for track
 */
export function trackTelemetry(event: string, payload?: Record<string, unknown>): void {
  track(event as TelemetryEvent, payload as Payload)
}

export type { TelemetryEvent, Tab, Payload, TelemetryContext }
