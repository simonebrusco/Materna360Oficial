import { z } from 'zod'

export const QuickIdeasFilters = z.object({
  location: z.enum(['casa', 'parque', 'escola', 'area_externa']),
  time_window_min: z.number().default(10),
  energy: z.enum(['exausta', 'normal', 'animada']),
})

export const FlashRoutineFilters = z.object({})

export const IdeaLite = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().optional(),
})

export const ProfileSummary = z.object({
  mode: z.enum(['single', 'all']),
  activeChildId: z.string().nullable(),
  children: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    age_bucket: z.enum(['0-1', '2-3', '4-5', '6-7', '8+']),
  })),
})

export const RecProduct = z.object({
  id: z.string(),
  name: z.string(),
})

export const SelfCare = z.object({
  id: z.string(),
  name: z.string(),
})

export const FlashRoutine = z.object({
  routine: z.any().nullable(),
  strategy: z.string().optional(),
  analyticsSource: z.enum(['local', 'ai']).default('local'),
})

export type QuickIdeasFiltersSchema = z.infer<typeof QuickIdeasFilters>
export type FlashRoutineFiltersSchema = z.infer<typeof FlashRoutineFilters>
export type IdeaLiteSchema = z.infer<typeof IdeaLite>
export type ProfileSummaryT = z.infer<typeof ProfileSummary>
export type RecProductSchema = z.infer<typeof RecProduct>
export type SelfCareSchema = z.infer<typeof SelfCare>
export type FlashRoutineT = z.infer<typeof FlashRoutine>
export type AgeBucketT = '0-1' | '2-3' | '4-5' | '6-7' | '8+'
