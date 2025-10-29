export type QuickIdeasLocation = 'casa' | 'parque' | 'escola' | 'area_externa'
export type QuickIdeasEnergy = 'exausta' | 'normal' | 'animada'
export type QuickIdeasTimeWindow = 5 | 10 | 20
export type QuickIdeasAgeBucket = '0-1' | '2-3' | '4-5' | '6-7' | '8+'

export interface QuickIdea {
  id: string
  title: string
  summary?: string
  time_total_min?: number
  location?: QuickIdeasLocation
  materials?: string[]
  steps?: string[]
  age_adaptations?: Record<string, string>
  safety_notes?: string
  badges?: string[]
  planner_payload?: any
  rationale?: string
}

export interface QuickIdeaCatalogEntry {
  idea: QuickIdea
  child?: {
    id: string
    name?: string
    age_bucket: QuickIdeasAgeBucket
  }
}
