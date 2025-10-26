import { z } from 'zod'

export const AgeBucket = z.enum(['0-1', '2-3', '4-5', '6-7', '8+'])
export const LocaleFit = z.enum(['casa', 'parque', 'escola', 'area_externa'])
export const Energy = z.enum(['exausta', 'normal', 'animada'])

export const ProfileChild = z.object({
  id: z.string(),
  name: z.string().optional(),
  age_bucket: AgeBucket,
})

export const ProfileSummary = z.object({
  mode: z.enum(['single', 'all']),
  activeChildId: z.string().nullable(),
  children: z.array(ProfileChild),
})

export const QuickIdeasFilters = z.object({
  location: LocaleFit,
  time_window_min: z.number().int().min(1).max(120),
  energy: Energy,
})

export const FlashRoutineFilters = z.object({
  locale: LocaleFit,
  time_window_min: z.number().int().min(1).max(120),
  energy: Energy,
})

const FlashRoutineStep = z.object({
  title: z.string(),
  minutes: z.number().int().min(1),
  ideaId: z.string().optional(),
})

export const IdeaLite = z.object({
  id: z.string(),
  title: z.string(),
  durationMin: z.number().int().min(1),
  materials: z.array(z.string()),
  steps: z.array(z.union([z.string(), FlashRoutineStep.pick({ title: true, minutes: true })])),
  safetyNotes: z.array(z.string()).optional(),
  ageBuckets: z.array(AgeBucket),
  locales: z.array(LocaleFit),
  tags: z.array(z.string()).optional(),
})

export const FlashRoutine = z.object({
  id: z.string(),
  title: z.string(),
  totalMin: z.number().int().min(5).max(30),
  steps: z.array(FlashRoutineStep).length(3),
  ageBucket: AgeBucket,
  locale: LocaleFit,
  materials: z.array(z.string()),
  safetyNotes: z.array(z.string()).optional(),
  active: z.boolean(),
})

export const RecProduct = z.object({
  id: z.string(),
  kind: z.enum(['book', 'toy', 'course', 'printable']),
  title: z.string(),
  subtitle: z.string().optional(),
  imageUrl: z.string().url(),
  ageBuckets: z.array(AgeBucket),
  skills: z.array(z.string()).optional(),
  retailer: z.string(),
  affiliateUrl: z.string().url(),
  priceHint: z.string().optional(),
  reasons: z.array(z.string()).optional(),
  safetyFlags: z.array(z.string()).optional(),
  localeFit: z.array(LocaleFit).optional(),
  sortWeight: z.number().optional(),
  createdAt: z.string().optional(),
  active: z.boolean(),
})

export const SelfCare = z.object({
  id: z.string(),
  title: z.string(),
  minutes: z.union([z.literal(2), z.literal(5), z.literal(10)]),
  energyFit: z.array(Energy),
  steps: z.array(z.string()).min(2).max(4),
  tip: z.string().optional(),
  image: z.string().url().optional(),
  active: z.boolean(),
  sortWeight: z.number().optional(),
  createdAt: z.string().optional(),
})

export type AgeBucketT = z.infer<typeof AgeBucket>
export type LocaleFitT = z.infer<typeof LocaleFit>
export type EnergyT = z.infer<typeof Energy>
export type ProfileChildT = z.infer<typeof ProfileChild>
export type ProfileSummaryT = z.infer<typeof ProfileSummary>
export type QuickIdeasFiltersT = z.infer<typeof QuickIdeasFilters>
export type FlashRoutineFiltersT = z.infer<typeof FlashRoutineFilters>
export type IdeaLiteT = z.infer<typeof IdeaLite>
export type FlashRoutineT = z.infer<typeof FlashRoutine>
export type RecProductT = z.infer<typeof RecProduct>
export type SelfCareT = z.infer<typeof SelfCare>
