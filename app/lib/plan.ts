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
 *
 * ⚠️ Regra P23:
 * Este módulo existe para persistência/infra de plano.
 * Componentes de UI não devem decidir comportamento via isPremium/isPaid;
 * devem usar a camada de experiência (app/lib/experience/*).
 */
export function getPlan(): PlanName {
  if (typeof window === 'undefined') return 'free'
  return normalizePlan(localStorage.getItem(STORAGE_KEY))
}

/**
 * Helpers
 *
 * @deprecated (P23) Não use em UI. Use app/lib/experience/experienceTier + helpers.
 * Mantido por compatibilidade com código legado.
 */
export const isPaid = () => getPlan() !== 'free'

/**
 * @deprecated (P23) Não use em UI. Use app/lib/experience/experienceTier + helpers.
 * Mantém semântica antiga: "premium" = "pago".
 */
export const isPremium = () => isPaid()

/**
 * OK usar quando for regra de infra/roteamento (ex.: gating de endpoints ou persistência),
 * mas evite em UI. Preferir experience tier.
 */
export const isMaterna360 = () => getPlan() === 'materna-360'

/**
 * Set the plan in localStorage and emit telemetry event.
 */
export function setPlan(plan: PlanName): void {
  if (typeof window === 'undefined') return
  const previousPlan = getPlan()
  localStorage.setItem(STORAGE_KEY, plan)

  if (plan !== previousPlan) {
    track('plan_upgrade_attempt', {
      from: previousPlan,
      to: plan,
      timestamp: new Date().toISOString(),
    })

    // P16 — avisa a mesma aba (sem refresh)
    try {
      window.dispatchEvent(new Event('m360:plan-updated'))
    } catch {}
  }
}

/**
 * Upgrade to a paid plan (Materna+ or Materna 360).
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
