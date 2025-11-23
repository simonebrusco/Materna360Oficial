export type PlanId = 'free' | 'plus' | 'premium'

export type FeatureKey =
  | 'ideas.dailyQuota'
  | 'export.pdf'
  | 'journeys.concurrentSlots'
  | 'audio.progress'
  | 'insights.weekly'

export type PlanSpec = {
  id: PlanId
  label: string
  limits: Partial<Record<FeatureKey, number | boolean>>
}

export const PLANS: Record<PlanId, PlanSpec> = {
  free: {
    id: 'free',
    label: 'Free',
    limits: {
      'ideas.dailyQuota': 5,
      'export.pdf': false,
      'journeys.concurrentSlots': 1,
      'audio.progress': false,
      'insights.weekly': true,
    },
  },
  plus: {
    id: 'plus',
    label: 'Plus',
    limits: {
      'ideas.dailyQuota': 20,
      'export.pdf': true,
      'journeys.concurrentSlots': 3,
      'audio.progress': true,
      'insights.weekly': true,
    },
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    limits: {
      'ideas.dailyQuota': 999,
      'export.pdf': true,
      'journeys.concurrentSlots': 6,
      'audio.progress': true,
      'insights.weekly': true,
    },
  },
}
