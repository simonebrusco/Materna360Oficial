import { track } from './telemetry'

export type PlanName = 'free' | 'premium'

/**
 * Get the current plan from localStorage.
 * SSR-safe: returns 'free' on server.
 */
export function getPlan(): PlanName {
  if (typeof window === 'undefined') return 'free'
  return (localStorage.getItem('m360.plan') as PlanName) || 'free'
}

/**
 * Check if user has premium plan.
 */
export const isPremium = () => getPlan() === 'premium'

/**
 * Set the plan in localStorage and emit telemetry event.
 */
export function setPlan(plan: PlanName): void {
  if (typeof window === 'undefined') return
  const previousPlan = getPlan()
  localStorage.setItem('m360.plan', plan)

  // Track plan change
  if (plan !== previousPlan) {
    track('plan_upgrade_attempt', {
      from: previousPlan,
      to: plan,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Upgrade to premium plan.
 * Emits telemetry event for analytics.
 */
export function upgradeToPremium(): void {
  setPlan('premium')
  track('paywall_confirm', {
    plan: 'premium',
    source: 'plan_upgrade_button',
    timestamp: new Date().toISOString()
  })
}
