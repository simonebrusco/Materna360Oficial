import { setTelemetryProvider, type TelemetryContext } from './telemetry'

/**
 * Aqui você pode plugar seu provedor real (ex: enviar para uma API).
 * Por enquanto, fica no-op em produção e loga em dev.
 */
setTelemetryProvider((ctx: TelemetryContext) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[telemetry/server]', ctx)
  }
})
