'use client'

// Canonical re-exports from the unified telemetry module
export { track, trackTelemetry, setTelemetryProvider } from './telemetry'
export type { TelemetryEventName, TelemetryPayload } from './telemetry'
export default track
