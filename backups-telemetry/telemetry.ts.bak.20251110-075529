// app/lib/telemetry.ts — permissive hotfix (temporário)

// Permissivo: aceita qualquer nome de evento e qualquer payload
export type TelemetryEventName = string;
type TelemetryEventPayloads = Record<string, unknown>;

export function track<E extends TelemetryEventName>(
  name: E,
  payload: TelemetryEventPayloads
): void {
  try {
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', name, payload);
      }
      window.dispatchEvent(
        new CustomEvent('m360:telemetry', {
          detail: { name, payload, ts: Date.now() },
        })
      );
    } else {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[telemetry][server]', name, payload);
      }
    }
  } catch {
    // no-op
  }
}

export const trackTelemetry = track;
export type { TelemetryEventPayloads as TelemetryPayloads };
