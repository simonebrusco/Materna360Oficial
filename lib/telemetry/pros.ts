export function trackProsClick(payload: {
  professionalId: string
  action: 'whatsapp' | 'agendar'
  profession: string
  specialties?: string[]
  page?: number
  filters?: Record<string, unknown>
}) {
  try {
    const body = JSON.stringify(payload)
    const blob = new Blob([body], { type: 'application/json' })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon?.('/api/telemetry/pros-click', blob)) {
      return
    }
    if (typeof window !== 'undefined') {
      void window.fetch('/api/telemetry/pros-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      })
    }
  } catch {
    // ignore telemetry errors
  }
}
