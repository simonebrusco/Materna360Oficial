'use client'
export { track, setTelemetryProvider } from './telemetry'

/** Deprecated default export kept for back-compat if any import still uses it. */
export default function trackTelemetry(event: any, payload?: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const { track } = require('./telemetry')
  track(event as any, payload as any)
}
