'use client'

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
  | 'eu360.summary_view'
  | 'discover.suggestion_saved'
  | (string & {}) // allow forward-compatible custom events

export type TelemetryPayload = Record<string, unknown>

type LegacyShape = {
  event: TelemetryEventName
  payload?: TelemetryPayload
} & Record<string, unknown>

type Provider = (name: TelemetryEventName, payload?: TelemetryPayload) => void
let provider: Provider | null = null

export function setTelemetryProvider(p: Provider | null) {
  provider = p
}

// -------------------- Overloads --------------------
export function track(name: TelemetryEventName, payload?: TelemetryPayload): void
export function track(legacy: LegacyShape): void
export function track(a: any, b?: any): void {
  let name: TelemetryEventName
  let payload: TelemetryPayload | undefined

  if (typeof a === 'string') {
    // Style A (preferred): track('event', { ... })
    name = a as TelemetryEventName
    payload = b ?? {}
  } else if (a && typeof a === 'object' && typeof a.event === 'string') {
    // Style B (legacy): track({ event: '...', payload?, ...rest })
    name = a.event as TelemetryEventName
    const { event, payload: p, ...rest } = a as LegacyShape
    payload = p ? { ...rest, ...p } : rest
  } else {
    // Unknown shape -> no-op
    return
  }

  // Non-blocking
  queueMicrotask(() => {
    if (process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === '1') {
      try {
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', { event: name, ...(payload ?? {}) })
      } catch {}
    }
    try {
      provider?.(name, payload)
      // Future hooks: sendBeacon/fetch keepalive here if no provider.
    } catch {
      /* swallow */
    }
  })
}

// Back-compat export
export const trackTelemetry = track

// Default export for any default-import call sites
export default track
