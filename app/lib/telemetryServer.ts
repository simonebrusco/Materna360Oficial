'use server'

import { setTelemetryProvider, type TelemetryEventName, type TelemetryPayload } from './telemetry'

/**
 * Server-side telemetry wiring (no-op by default).
 * Plug your real provider here (e.g., send to an API or GA4 via Measurement Protocol).
 */
export function initTelemetryServer() {
  setTelemetryProvider((name: TelemetryEventName, payload?: TelemetryPayload) => {
    try {
      // Example no-op (keep logs disabled in prod by default)
      // console.log('[telemetry:server]', { event: name, ...(payload ?? {}) })
      // TODO (P1.5/P2): send to your backend or 3rd-party service
    } catch {
      // swallow
    }
  })
}

// Optional helper to disable provider (tests, etc.)
export function disableTelemetryServer() {
  setTelemetryProvider(null)
}
