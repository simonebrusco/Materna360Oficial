let provider: ((event: string, payload?: Record<string, unknown>, ctx?: Record<string, unknown>) => void) | null = null

export function setTelemetryProvider(
  fn: (event: string, payload?: Record<string, unknown>, ctx?: Record<string, unknown>) => void
) {
  provider = fn
}

export type TelemetryEvent =
  | 'discover_rec_impression'
  | 'discover_rec_click_buy'
  | 'discover_rec_save_planner'
  | 'discover_rec_view_details'
  | 'discover_flash_impression'
  | 'discover_flash_start'
  | 'discover_flash_save_planner'
  | 'discover_flash_error'
  | 'discover_selfcare_impression'
  | 'discover_selfcare_done'
  | 'discover_selfcare_save_planner'
  | 'discover_selfcare_error'
  | 'discover_section_error'
  | 'planner_save_ok'
  | 'planner_payload_invalid'
  | 'curator_request'
  | 'curator_response'
  | 'curator_error'
  | 'recipes.generate'
  | 'recipes.generate.error'
  | 'quick_ideas_bad_request'
  | 'planner.save'

export type TelemetryPayload = Record<string, unknown>
export type TelemetryContext = Record<string, unknown>

export function sample(p = 1): boolean {
  return Math.random() < p
}

const getStore = () => ({
  discover_rec_impression: 0,
  discover_rec_click_buy: 0,
  discover_rec_save_planner: 0,
  discover_rec_view_details: 0,
  discover_flash_impression: 0,
  discover_flash_start: 0,
  discover_flash_save_planner: 0,
  discover_flash_error: 0,
  discover_selfcare_impression: 0,
  discover_selfcare_done: 0,
  discover_selfcare_save_planner: 0,
  discover_selfcare_error: 0,
  discover_section_error: 0,
  planner_save_ok: 0,
  planner_payload_invalid: 0,
  curator_request: 0,
  curator_response: 0,
  curator_error: 0,
})

export function trackTelemetry(
  event: TelemetryEvent,
  payload: TelemetryPayload = {},
  ctx: TelemetryContext = {},
): void {
  try {
    if (provider) {
      void provider(event, payload, ctx)
    } else {
      // eslint-disable-next-line no-console
      console.debug(`[telemetry] ${event}`, { payload, ctx })
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[telemetry] provider error', err)
  }

  const store = getStore()
  const info = {
    event,
    ...payload,
  }

  // eslint-disable-next-line no-console
  console.info(`[telemetry] ${event}`, info)
}
