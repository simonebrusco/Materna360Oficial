// app/lib/telemetry.ts — permissive hotfix + provider API (compat com telemetryServer.ts)

// Aceita qualquer nome de evento e payload genérico
export type TelemetryEventName = string;
export type TelemetryPayload = Record<string, unknown>;
export type TelemetryPayloads = TelemetryPayload; // alias de compat

// Local telemetry sink for insights (preview/dev only)
const LOCAL_TEL_KEY = 'm360_telemetry_local';

function appendLocalEvent(name: TelemetryEventName, payload: TelemetryPayload, ts: number) {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(LOCAL_TEL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ event: name, payload, ts });
    // keep last 5k events to avoid unbounded growth
    const trimmed = arr.slice(-5000);
    localStorage.setItem(LOCAL_TEL_KEY, JSON.stringify(trimmed));
  } catch {
    // no-op
  }
}

export function readLocalEvents(): Array<{ event: string; payload?: TelemetryPayload; ts: number }> {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_TEL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearLocalEvents() {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_TEL_KEY);
  } catch {
    // no-op
  }
}

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
