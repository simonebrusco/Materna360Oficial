import { track } from './telemetry'

/**
 * ✅ Planos suportados (com compatibilidade legacy)
 * - 'premium' (legacy) => tratado como 'materna-plus'
 */
export type PlanName = 'free' | 'premium' | 'materna-plus' | 'materna-360'
export type PaidPlanId = 'materna-plus' | 'materna-360'

const STORAGE_KEY = 'm360.plan'

function normalizePlan(raw: string | null | undefined): PlanName {
  if (!raw) return 'free'

  const v = String(raw)

  // ✅ legacy
  if (v === 'premium') return 'materna-plus'

  // ✅ novos valores
  if (v === 'materna-plus' || v === 'materna-360' || v === 'free') return v

  // fallback seguro
  return 'free'
}

/**
 * Get the current plan from localStorage.
 * SSR-safe: returns 'free' on server.
 */
export function getPlan(): PlanName {
  if (typeof window === 'undefined') return 'free'
  return normalizePlan(localStorage.getItem(STORAGE_KEY))
}

/**
 * Helpers
 */
export const isPaid = () => getPlan() !== 'free'
export const isPremium = () => isPaid() // mantém semântica antiga (premium = pago)
export const isMaterna360 = () => getPlan() === 'materna-360'

/**
 * Set the plan in localStorage and emit telemetry event.
 */
export function setPlan(plan: PlanName): void {
  if (typeof window === 'undefined') return

  const next = normalizePlan(plan)
  const previous = getPlan()

  localStorage.setItem(STORAGE_KEY, next)

  if (next !== previous) {
    track('plan_change', {
      from: previous,
      to: next,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Upgrade to a paid plan (Materna+ or Materna+ 360).
 * Used by the UpgradeSheet contextual CTA.
 */
export function upgradeToPlan(planId: PaidPlanId, source: string = 'plan_upgrade_button'): void {
  const previous = getPlan()

  setPlan(planId)

  track('paywall_confirm', {
    plan: planId,
    from: previous,
    source,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Legacy alias — keeps older calls working.
 * Previously "premium" boolean; now maps to Materna+ (materna-plus).
 */
export function upgradeToPremium(): void {
  upgradeToPlan('materna-plus', 'plan_upgrade_button')
}
