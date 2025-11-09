'use client'

type Tab =
  | 'meu-dia'
  | 'cuidar'
  | 'maternar'
  | 'descobrir'
  | 'eu360'

export type TelemetryEventName =
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

export type TelemetryPayload = Record<string, unknown> & { tab?: Tab }

type LegacyShape = {
  event: TelemetryEventName
  payload?: Record<string, unknown>
} & Record<string, unknown>

type TelemetryContext = {
  event: TelemetryEventName
  tab?: Tab
  component?: string
  action?: string
  id?: string
  timestamp?: number
  [key: string]: unknown
}

const DEBUG =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === '1'

let telemetryProvider: ((ctx: TelemetryContext) => void) | null = null

/**
 * Set a custom telemetry provider (FS, GA4, Segment, etc.)
 */
export function setTelemetryProvider(provider: ((ctx: TelemetryContext) => void) | null): void {
  telemetryProvider = provider
}

/**
 * Fire-and-forget telemetry. Supports two calling styles:
 * - Style A (preferred):  track('nav.click', { tab: '...', dest: '...' })
 * - Style B (legacy):     track({ event: 'nav.click', tab: '...', payload: { dest: '...' } })
 *
 * Both styles work and produce the same result. Style A is preferred for new code.
 * Must never block UI.
 */

// Overload 1: Style A - track('event-name', { ...payload })
export function track(name: TelemetryEventName, payload?: TelemetryPayload): void

// Overload 2: Style B - track({ event: 'event-name', ...rest })
export function track(legacy: LegacyShape): void

// Implementation
export function track(a: any, b?: any): void {
  let name: TelemetryEventName
  let payload: TelemetryPayload | undefined

  try {
    if (typeof a === 'string') {
      // Style A: track('event', { ... })
      name = a as TelemetryEventName
      payload = b ?? {}
    } else if (a && typeof a === 'object' && typeof a.event === 'string') {
      // Style B: track({ event, ...rest, payload? })
      name = a.event as TelemetryEventName
      const { event, payload: p, ...rest } = a as LegacyShape
      payload = p ? { ...rest, ...p } : rest
    } else {
      // Unknown shape -> ignore safely
      return
    }

    // Non-blocking fire-and-forget
    queueMicrotask(() => {
      try {
        const ctx: TelemetryContext = { event: name, ...payload, timestamp: Date.now() }

        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug('[telemetry]', ctx)
        }

        if (telemetryProvider) {
          telemetryProvider(ctx)
        }
        // TODO: P1.5/P2: send to provider here (navigator.sendBeacon or fetch keepalive)
      } catch {
        // Never throw from telemetry
      }
    })
  } catch {
    // Never throw from telemetry
  }
}

/**
 * Backward-compatible alias for track
 */
export const trackTelemetry = track

export type { TelemetryEventName as TelemetryEvent, Tab, TelemetryPayload, TelemetryContext, Payload }

// Legacy type alias for backward compatibility
export type Payload = TelemetryPayload
