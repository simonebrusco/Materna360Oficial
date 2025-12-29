// app/lib/premium/capabilities.ts
/**
 * P32 — Preparação Premium Invisível
 * Lista única de capacidades internas (não é linguagem de marketing).
 * Não deve ser usada para UI nesta PR.
 */

export const PREMIUM_CAPABILITIES = [
  'planner_plus_blocks',
  'export_pdf',
  'saved_templates',
  'deep_insights',
] as const

export type PremiumCapability = (typeof PREMIUM_CAPABILITIES)[number]

export function isPremiumCapability(value: string): value is PremiumCapability {
  return (PREMIUM_CAPABILITIES as readonly string[]).includes(value)
}
