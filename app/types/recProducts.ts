import type { QuickIdeasAgeBucket, QuickIdeasLocation } from '@/app/types/quickIdeas'

export type RecProductKind = 'book' | 'toy' | 'course' | 'printable'

export type RecProduct = {
  id: string
  kind: RecProductKind
  title: string
  subtitle?: string
  imageUrl: string
  ageBuckets: QuickIdeasAgeBucket[]
  skills?: string[]
  retailer: string
  affiliateUrl: string
  priceHint?: string
  reasons?: string[]
  safetyFlags?: string[]
  localeFit?: QuickIdeasLocation[]
  sortWeight?: number
  active: boolean
}
