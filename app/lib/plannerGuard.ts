import { z } from 'zod'

const stringId = z.string().trim().min(1)
const stringTitle = z.string().trim().min(1)
const trimmedStringArray = z
  .array(z.string().transform((value) => value.trim()))
  .transform((values) => values.filter((value) => value.length > 0))

const PlannerIdea = z
  .object({
    type: z.literal('idea'),
    id: stringId,
    title: stringTitle,
    duration_min: z.number().int().min(1),
    materials: trimmedStringArray.default([]),
  })
  .passthrough()

const PlannerRoutineStep = z
  .object({
    title: stringTitle,
    minutes: z.number().int().min(1).max(30),
    ideaId: stringId.optional(),
  })
  .passthrough()

const PlannerRoutine = z
  .object({
    type: z.literal('routine'),
    id: stringId,
    title: stringTitle,
    totalMin: z.number().int().min(5).max(60),
    steps: z.array(PlannerRoutineStep).length(3),
    materials: trimmedStringArray.default([]),
    safetyNotes: trimmedStringArray.default([]),
  })
  .passthrough()

const PlannerProduct = z
  .object({
    type: z.literal('product'),
    id: stringId,
    title: stringTitle,
    kind: z.enum(['book', 'toy', 'course', 'printable']),
    imageUrl: z.string().url(),
    retailer: stringTitle,
    affiliateUrl: z.string().url(),
  })
  .passthrough()

const PlannerSelfCare = z
  .object({
    type: z.literal('selfcare'),
    id: stringId,
    title: stringTitle,
    minutes: z.union([z.literal(2), z.literal(5), z.literal(10)]),
    steps: z.array(z.string().trim().min(1)).min(2).max(6),
  })
  .passthrough()

const PlannerRecipe = z
  .object({
    type: z.literal('recipe'),
    id: stringId,
    title: stringTitle,
    readyInMinutes: z.number().int().min(1).max(240).optional(),
    servings: z.number().int().min(1).max(20).optional(),
    shoppingList: trimmedStringArray.default([]),
    note: z.string().trim().max(500).optional(),
  })
  .passthrough()

export const PlannerItem = z.union([PlannerIdea, PlannerRoutine, PlannerProduct, PlannerSelfCare, PlannerRecipe])
export type PlannerItemT = z.infer<typeof PlannerItem>

/** Throws ZodError on invalid input. Returns normalized safe object on success. */
export function validatePlannerItem(input: unknown): PlannerItemT {
  return PlannerItem.parse(input)
}
