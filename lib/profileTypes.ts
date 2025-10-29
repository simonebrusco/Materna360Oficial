import type { QuickIdeasAgeBucket } from '@/types/quickIdeas'

export type ProfileMode = 'single' | 'all'

export interface ProfileChildSummary {
  id: string
  name?: string
  age_bucket: QuickIdeasAgeBucket
}
