const GLOBAL_KEY = '__telemetry_store__';

type TelemetryEvent =
  | 'planner.save'
  | 'discover_rec_impression'
  | 'discover_rec_click_buy'
  | 'discover_rec_save_planner'
  | 'discover_rec_view_details'
  | 'quick_ideas_bad_request'
  | 'quick_ideas_access_denied'
  | 'quick_ideas_success'
  | 'quick_ideas_error';

function getStore(): Record<TelemetryEvent, number> {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = {} as Record<TelemetryEvent, number>;
  return g[GLOBAL_KEY];
}

export function trackTelemetry(event: TelemetryEvent, metadata?: Record<string, unknown>) {
  const store = getStore();
  store[event] = (store[event] ?? 0) + 1;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[telemetry]', event, metadata);
  }
}
