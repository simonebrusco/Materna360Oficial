# backup
cp app/lib/telemetry.ts app/lib/telemetry.ts.bak 2>/dev/null || true

# sobrescrever com versão compatível
cat > app/lib/telemetry.ts <<'TS'
// app/lib/telemetry.ts

/** Telemetria "no-op" segura para build/SSR. */
export type TelemetryEvent =
  | 'recipes.generate'
  | 'recipes.generate.error'
  | 'planner.add'
  | 'planner.add.error'
  | (string & {})

/** Envia eventos de telemetria de forma segura (silenciosa em prod sem provedor). */
export function trackTelemetry(event: TelemetryEvent, payload?: unknown): void {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', event, payload ?? {})
    }
    // Integração real pode ser adicionada aqui no futuro.
  } catch {
    // Nunca propagar erro para a UI.
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
  // Modo probabilidade
  if (typeof arg === 'number') {
    const p = Math.max(0, Math.min(1, arg))
    if (p === 0) return false
    if (p === 1) return true
    return Math.random() < p
  }

  // Modo array
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
TS
