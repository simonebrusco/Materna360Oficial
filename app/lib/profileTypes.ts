import type { QuickIdeasAgeBucket } from '@/app/types/quickIdeas'

export type ProfileMode = 'single' | 'all'

export type ProfileChildSummary = {
  id: string
  name?: string
  age_bucket: QuickIdeasAgeBucket
}

export type ProfileSummary = {
  mode: ProfileMode
  activeChildId: string | null
  children: ProfileChildSummary[]
}
