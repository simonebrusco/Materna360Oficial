
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
  | 'curator_error'
  // Legacy surfaces (AI recipes / quick ideas / planner)
  | 'recipes.generate'
  | 'recipes.generate.error'

export type TelemetryEvent =
  | 'recipes.generate'
  | 'recipes.generate.error'
  | 'planner.save'

  | 'quick-ideas.generate'
  | 'quick-ideas.generate.error'
  | 'quick_ideas_success'
  | 'quick_ideas_error'
  | 'quick_ideas_access_denied'
  | 'quick_ideas_bad_request'

  | 'planner.save';

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

  | 'discover_rec_impression'
  | 'discover_rec_click_buy'
  | 'discover_rec_save_planner'
  | 'discover_rec_view_details'
  | 'discover_flash_impression'
  | 'discover_flash_save_planner'
  | 'discover_flash_start'
  | 'discover_flash_error'
  | 'discover_selfcare_impression'
  | 'discover_selfcare_done'
  | 'discover_selfcare_save_planner'
  | 'discover_selfcare_error'

const GLOBAL_KEY = '__materna360Telemetry__'

const getStore = () => {
  const globalRef = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: Record<TelemetryEvent, number>
  }

  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = {
      'recipes.generate': 0,
      'recipes.generate.error': 0,
      'planner.save': 0,
      'quick-ideas.generate': 0,
      'quick-ideas.generate.error': 0,
      'quick_ideas_success': 0,
      'quick_ideas_error': 0,
      'quick_ideas_access_denied': 0,
      'quick_ideas_bad_request': 0,
      'discover_rec_impression': 0,
      'discover_rec_click_buy': 0,
      'discover_rec_save_planner': 0,
      'discover_rec_view_details': 0,
      'discover_flash_impression': 0,
      'discover_flash_save_planner': 0,
      'discover_flash_start': 0,
      'discover_flash_error': 0,
      'discover_selfcare_impression': 0,
      'discover_selfcare_done': 0,
      'discover_selfcare_save_planner': 0,
      'discover_selfcare_error': 0,
    }
  }

  return globalRef[GLOBAL_KEY] as Record<TelemetryEvent, number>
}

export function trackTelemetry(event: TelemetryEvent, metadata?: Record<string, unknown>) {
  const store = getStore()
  store[event] = (store[event] ?? 0) + 1

  const info = {
    count: store[event],
    ...metadata,
  }

  console.info(`[telemetry] ${event}`, info)

}
