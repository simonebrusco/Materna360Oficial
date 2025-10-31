// app/lib/telemetry.ts

export type TelemetryEvent =
  | 'recipes.generate'
  | 'recipes.generate.error'
  | 'planner.add'
  | 'planner.add.error'
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

/** Envia eventos de telemetria de forma segura (silenciosa em prod sem provedor). */
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
    // nunca propagar erro
  }
}

/**
 * sample(prob) -> boolean com probabilidade "prob"
 * sample(arr) -> um item aleatório ou null se vazio
 * sample(arr, n) -> n itens únicos aleatórios (ou [] se vazio)
 */
export function sample(prob: number): boolean
export function sample<T>(arr: readonly T[]): T | null
export function sample<T>(arr: readonly T[], n: number): T[]
export function sample<T>(
  arg: number | readonly T[],
  n = 1
): boolean | T | T[] | null {
  if (typeof arg === 'number') {
    const p = Math.max(0, Math.min(1, arg))
    if (p === 0) return false
    if (p === 1) return true
    return Math.random() < p
  }
  const arr = arg
  if (!Array.isArray(arr) || arr.length === 0) {
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
