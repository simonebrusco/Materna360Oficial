export type QuickIdeasPlan = 'free' | 'essencial' | 'premium'
export type QuickIdeasAgeBucket = '0-1' | '2-3' | '4-5' | '6-7' | '8+'
export type QuickIdeasLocation = 'casa' | 'parque' | 'escola' | 'area_externa'
export type QuickIdeasEnergy = 'exausta' | 'normal' | 'animada'
export type QuickIdeasTimeWindow = 5 | 10 | 20
export type QuickIdeasBadge =
  | 'curta'
  | 'sem_bagunça'
  | 'ao_ar_livre'
  | 'motor_fino'
  | 'motor_grosso'
  | 'linguagem'
  | 'sensorial'

export type QuickIdeasChildInput = {
  id: string
  name?: string | null
  age_bucket: QuickIdeasAgeBucket
}

export type QuickIdeasProfileInput = {
  active_child_id?: string | null
  children: QuickIdeasChildInput[]
  mode: 'single' | 'all'
}

export type QuickIdeasContextInput = {
  location: QuickIdeasLocation
  time_window_min: QuickIdeasTimeWindow
  energy: QuickIdeasEnergy
}

export type QuickIdeasRequestPayload = {
  plan: QuickIdeasPlan
  profile: QuickIdeasProfileInput
  context: QuickIdeasContextInput
  locale?: string
}

export type QuickIdeasPlannerPayload = {
  type: 'idea'
  duration_min: number
  materials: string[]
}

export type QuickIdea = {
  id: string
  title: string
  summary: string
  time_total_min: number
  location: QuickIdeasLocation
  materials: string[]
  steps: string[]
  age_adaptations: Partial<Record<QuickIdeasAgeBucket, string>>
  safety_notes: string[]
  badges: QuickIdeasBadge[]
  planner_payload: QuickIdeasPlannerPayload
  rationale: string
}

export type QuickIdeaCatalogEntry = QuickIdea & {
  ageBuckets: QuickIdeasAgeBucket[]
  suitableEnergies: QuickIdeasEnergy[]
}

export type QuickIdeasModelResponse = {
  ideas: QuickIdea[]
}
