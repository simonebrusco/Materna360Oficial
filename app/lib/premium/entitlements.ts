// app/lib/premium/entitlements.ts
/**
 * P32 — Entitlements (sempre FREE nesta PR).
 * Não conecta billing. Não muda UI. Não cria expectativa.
 */

import type { PremiumCapability } from './capabilities'
import { PREMIUM_CAPABILITIES } from './capabilities'
import { PREMIUM_FLAGS } from './flags'

export type PremiumTier = 'free' | 'premium'

export type PremiumEntitlements = {
  tier: PremiumTier
  caps: Record<PremiumCapability, boolean>
}

/**
 * Default absoluto: free completo (sem capacidade premium habilitada).
 * Observação: "free completo" aqui significa UX, não features premium.
 * Este objeto NÃO deve ser usado para esconder ou alterar UI nesta PR.
 */
export const DEFAULT_ENTITLEMENTS: PremiumEntitlements = Object.freeze({
  tier: 'free',
  caps: Object.freeze(
    PREMIUM_CAPABILITIES.reduce((acc, cap) => {
      acc[cap] = false
      return acc
    }, {} as Record<PremiumCapability, boolean>)
  ),
})

export function hasCapability(ent: PremiumEntitlements, cap: PremiumCapability) {
  return Boolean(ent.caps[cap])
}

/**
 * Resolver principal (no-op nesta PR):
 * - Sempre retorna DEFAULT_ENTITLEMENTS
 * - Mantém ponto único para evolução futura
 */
export async function getEntitlements(): Promise<PremiumEntitlements> {
  // Nesta PR não existe integração com billing.
  // Flag fica aqui apenas como ponto estrutural (não usada ainda).
  if (!PREMIUM_FLAGS.enableEntitlementsResolver) {
    return DEFAULT_ENTITLEMENTS
  }

  // Mesmo quando habilitado (ambiente interno), ainda retorna FREE nesta PR.
  // P32 não ativa premium, só prepara estrutura.
  return DEFAULT_ENTITLEMENTS
}
