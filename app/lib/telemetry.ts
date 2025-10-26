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
