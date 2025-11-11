'use client'

import { isPremium } from './plan'
import { track } from './telemetry'

/**
 * Gate a premium feature.
 * Returns true if user is premium, false otherwise.
 * Emits telemetry for analytics.
 */
export function canAccessPremium(
  featureName: string,
  context?: string
): boolean {
  const premium = isPremium()
  
  if (!premium) {
    track('paywall_open', {
      feature: featureName,
      context: context || 'unknown'
    })
  }
  
  return premium
}

/**
 * Gate a premium action with confirmation.
 * Call this before performing a premium-only action.
 */
export function gatePremiumAction(
  featureName: string,
  context?: string
): { allowed: boolean; message: string } {
  if (isPremium()) {
    return {
      allowed: true,
      message: ''
    }
  }

  track('paywall_open', {
    feature: featureName,
    context: context || 'unknown',
    action: 'attempt_access'
  })

  return {
    allowed: false,
    message: `${featureName} está disponível apenas para planos Premium`
  }
}
