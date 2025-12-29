// app/lib/premium/flags.ts
/**
 * P32 — Flags internas (defaults seguros).
 * Nesta PR: nenhuma flag deve ativar comportamento em UI.
 * Flags existem para evitar "if" espalhado no futuro.
 */

function readBoolEnv(name: string, defaultValue: boolean) {
  const raw = process.env[name]
  if (!raw) return defaultValue
  const v = raw.trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return defaultValue
}

export const PREMIUM_FLAGS = Object.freeze({
  /**
   * Habilita resolução alternativa de entitlement para ambientes internos.
   * Default: false (sempre).
   */
  enableEntitlementsResolver: readBoolEnv('MATERNA360_PREMIUM_ENTITLEMENTS', false),

  /**
   * Permite simulação segura (futuro) em ambientes internos.
   * Default: false (sempre).
   */
  allowDevOverrides: readBoolEnv('MATERNA360_PREMIUM_DEV_OVERRIDES', false),
})
