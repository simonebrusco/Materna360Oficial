// app/lib/telemetry.ts — permissive hotfix + provider API (compat com telemetryServer.ts)

// Aceita qualquer nome de evento e payload genérico
export type TelemetryEventName = string;
export type TelemetryPayload = Record<string, unknown>;
export type TelemetryPayloads = TelemetryPayload; // alias de compat

// Provider opcional para capturar eventos (server ou client)
type TelemetryHandler = (name: TelemetryEventName, payload: TelemetryPayload) => void;
let __provider: TelemetryHandler | null = null;

// Exposto para o server configurar um handler (ex.: persistir/logar no servidor)
export function setTelemetryProvider(fn: TelemetryHandler | null) {
  __provider = fn;
}

// Função principal de tracking (não-bloqueante, SSR-safe)
export function track(name: TelemetryEventName, payload: TelemetryPayload): void {
  try {
    // 1) Dispara provider se existir (server ou client)
    if (__provider) {
      try { __provider(name, payload); } catch { /* no-op */ }
    }

    // 2) Ambiente de navegador: console.debug + CustomEvent para dev tools
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[telemetry]', name, payload);
      }
      try {
        window.dispatchEvent(new CustomEvent('m360:telemetry', {
          detail: { name, payload, ts: Date.now() },
        }));
      } catch { /* no-op */ }
    } else {
      // 3) Ambiente server (sem quebrar)
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[telemetry][server]', name, payload);
      }
    }
  } catch {
    // Nunca quebrar build/UI por causa de telemetria
  }
}

// Alias usado em diversas partes do app
export const trackTelemetry = track;
