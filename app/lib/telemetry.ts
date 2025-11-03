export type TelemetryEvent =
  | 'recipes.generate'
  | 'recipes.generate.error'
  | 'planner.add'
  | 'planner.add.error'
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
  | (string & {})

export type TelemetryContext = Record<string, unknown>

export type TelemetrySink = (
  event: TelemetryEvent,
  payload?: unknown,
  ctx?: TelemetryContext
) => void | Promise<void>

let provider: TelemetrySink | null = null

export function setTelemetryProvider(fn: TelemetrySink) {
  provider = fn
}

export function sample(p = 1): boolean {
  return Math.random() < p
}

export function trackTelemetry(
  event: TelemetryEvent,
  payload: unknown = {},
  ctx: TelemetryContext = {}
): void {
  try {
    if (provider) {
      void provider(event, payload, ctx)
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', event, payload ?? {}, ctx ?? {})
    }
  } catch {
    // never propagate error
  }
}

export function pick<T>(arg: T | T[], n?: 1): T | null
export function pick<T>(arg: T | T[], n: number): T[]
export function pick<T>(arg: T | T[], n = 1): T | T[] | null {
  const arr = arg instanceof Array ? arg : [arg]
  if (arr.length === 0) {
    return n === 1 ? null : []
  }
  if (n <= 1) {
    return arr[Math.floor(Math.random() * arr.length)] ?? null
  }
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}
