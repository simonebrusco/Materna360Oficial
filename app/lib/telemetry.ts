// app/lib/telemetry.ts

/** Telemetria "no-op" segura para build/SSR. */
export type TelemetryEvent =
  | 'recipes.generate'
  | 'recipes.generate.error'
  | 'planner.add'
  | 'planner.add.error'
  | (string & {});

/** Envia eventos de telemetria de forma segura (silenciosa em prod sem provedor). */
export function trackTelemetry(event: TelemetryEvent, payload?: unknown): void {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Evita quebrar o build caso não exista provedor real.
      // Mantém log útil em dev.
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', event, payload ?? {});
    }
    // Aqui você pode integrar com um provedor real futuramente.
  } catch {
    // Nunca deve estourar erro para a UI.
  }
}

/** Amostra 1 item de um array (ou null se vazio). */
export function sample<T>(arr: T[] | readonly T[]): T | null {
  if (!arr || arr.length === 0) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] ?? null;
}
