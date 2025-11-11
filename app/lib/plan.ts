export type PlanName = 'free' | 'premium'

export function getPlan(): PlanName {
  if (typeof window === 'undefined') return 'free'
  return (localStorage.getItem('m360.plan') as PlanName) || 'free'
}

export const isPremium = () => getPlan() === 'premium'

export function setPlan(plan: PlanName): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('m360.plan', plan)
}
