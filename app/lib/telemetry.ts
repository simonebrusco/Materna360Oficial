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
  | 'badge.unlocked'
  | 'toast.shown'
  | 'audio.play'
  | 'audio.pause'
  | 'audio.restart'
  | 'audio.end'
  | 'audio.select'
  | 'discover.suggestion_saved'

type TelemetryProvider = (event: TelemetryEventName, payload?: Record<string, unknown>) => void

let provider: TelemetryProvider | null = null

export function setTelemetryProvider(p: TelemetryProvider | null) {
  provider = p
}

/** Non-blocking fire-and-forget telemetry call. */
export function track(event: TelemetryEventName, payload?: Record<string, unknown>) {
  const debug =
    typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === '1'

  queueMicrotask(() => {
    try {
      provider?.(event, payload)
      if (debug) {
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', { event, ...(payload || {}), ts: Date.now() })
      }
    } catch {
      /* swallow */
    }
  })
}
