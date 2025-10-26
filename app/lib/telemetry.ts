type TelemetryPayload = Record<string, unknown>;

export type TelemetryEvent =
  // Discover – impressions & actions
  | 'discover_rec_impression'
  | 'discover_rec_click_buy'
  | 'discover_rec_save_planner'
  | 'discover_flash_impression'
  | 'discover_flash_start'
  | 'discover_flash_save_planner'
  | 'discover_selfcare_impression'
  | 'discover_selfcare_done'
  | 'discover_selfcare_save_planner'
  // Errors / infra
  | 'discover_section_error'
  | 'planner_save_ok'
  | 'planner_payload_invalid'
  | 'curator_request'
  | 'curator_response'
  | 'curator_error';

export type TelemetryContext = {
  appVersion?: string;
  route?: string;
  tz?: string;
  dateKey?: string;
  source?: 'local' | 'ai';
  flags?: Record<string, boolean>;
};

let provider:
  | ((event: TelemetryEvent, payload?: TelemetryPayload, ctx?: TelemetryContext) => void | Promise<void>)
  | null = null;

export function setTelemetryProvider(
  fn: (event: TelemetryEvent, payload?: TelemetryPayload, ctx?: TelemetryContext) => void | Promise<void>,
) {
  provider = fn;
}

export function sample(p = 1): boolean {
  return Math.random() < p;
}

export function trackTelemetry(
  event: TelemetryEvent,
  payload: TelemetryPayload = {},
  ctx: TelemetryContext = {},
): void {
  try {
    if (provider) {
      void provider(event, payload, ctx);
    } else {
      // eslint-disable-next-line no-console
      console.debug(`[telemetry] ${event}`, { payload, ctx });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[telemetry] provider error', err);
  }
}
