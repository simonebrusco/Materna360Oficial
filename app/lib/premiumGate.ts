'use client'

import { type FeatureKey, PLANS, type PlanId } from './plans'
import { getCurrentPlanId } from './planClient'

/**
 * Check if a feature is available in the current plan
 * @param feature - Feature key to check
 * @returns true if feature is available, false otherwise
 */
export function canAccess(feature: FeatureKey): boolean {
  const planId = getCurrentPlanId()
  const plan = PLANS[planId]
  const limit = plan.limits[feature]
  
  if (typeof limit === 'boolean') return limit
  if (typeof limit === 'number') return limit > 0
  return false
}

/**
 * Get the minimum plan required for a feature
 * @param feature - Feature key
 * @returns Plan ID that first enables this feature, or 'premium' if not available
 */
export function getMinimumPlanFor(feature: FeatureKey): PlanId {
  const planIds: PlanId[] = ['free', 'plus', 'premium']
  
  for (const planId of planIds) {
    const plan = PLANS[planId]
    const limit = plan.limits[feature]
    if (typeof limit === 'boolean' && limit) return planId
    if (typeof limit === 'number' && limit > 0) return planId
  }
  
  return 'premium'
}

/**
 * Require premium access for an action
 * Returns true if user has access, false if needs upgrade
 * @param feature - Feature key being accessed
 * @param actionName - Name of action for telemetry
 * @returns true if user can access, false if needs upgrade
 */
export function requirePremium(
  feature: FeatureKey,
  actionName?: string
): boolean {
  const hasAccess = canAccess(feature)
  
  if (!hasAccess && actionName) {
    // Optionally emit telemetry here
    console.debug(`[premiumGate] Access denied for ${actionName}`)
  }
  
  return hasAccess
}

/**
 * Get a user-friendly message for why a feature is locked
 * @param feature - Feature key
 * @returns Friendly message about the feature lock
 */
export function getLockedMessage(feature: FeatureKey): string {
  const minimumPlan = getMinimumPlanFor(feature)
  const planLabel = PLANS[minimumPlan].label
  
  const featureMessages: Record<FeatureKey, string> = {
    'export.pdf': 'Exportar relatórios em PDF está disponível apenas no plano Plus e acima.',
    'ideas.dailyQuota': `Limite de ideias diárias. Atualize para ${planLabel} para mais.`,
    'journeys.concurrentSlots': `Mais jornadas simultâneas disponíveis no plano ${planLabel}.`,
    'audio.progress': `Acompanhamento de áudio disponível no plano ${planLabel}.`,
    'insights.weekly': `Insights semanais disponíveis no plano ${planLabel}.`,
  }
  
  return featureMessages[feature] || `Este recurso está disponível no plano ${planLabel}.`
}
