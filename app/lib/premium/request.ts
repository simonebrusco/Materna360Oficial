// app/lib/premium/request.ts
/**
 * P32 — Request-scoped entitlements (server-safe).
 * Nesta fase, o resultado continua SEMPRE FREE.
 *
 * Objetivo: evitar imports espalhados e garantir ponto único
 * para evolução futura (billing/assinatura/entitlement), sem impacto em UI.
 */

import 'server-only'
import { cache } from 'react'
import { getEntitlements, type PremiumEntitlements } from './entitlements'

/**
 * getRequestEntitlements
 * - Cacheado por request em Server Components (React cache).
 * - Mantém comportamento no-op (free) porque getEntitlements já é no-op em P32.
 */
export const getRequestEntitlements = cache(async (): Promise<PremiumEntitlements> => {
  return getEntitlements()
})
