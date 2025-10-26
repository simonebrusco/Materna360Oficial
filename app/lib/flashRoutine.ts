import { fnv1a } from '@/app/lib/hash'
import { youngestBucket } from '@/app/lib/quickIdeasCatalog'
import type { IdeaLite, FlashRoutine, FlashRoutineStep } from '@/app/types/flashRoutine'
import type { QuickIdeasAgeBucket, QuickIdeasLocation } from '@/app/types/quickIdeas'

const LOCALE_LABEL: Record<QuickIdeasLocation, string> = {
  casa: 'Casa',
  parque: 'Parque',
  escola: 'Escola',
  area_externa: 'Área Externa',
}

const ENERGY_STEP_MINUTES: Record<'exausta' | 'normal' | 'animada', number[]> = {
  exausta: [5, 5, 5],
  normal: [5, 6, 6],
  animada: [6, 7, 7],
}

const ENERGY_MAX_MATERIALS: Record<'exausta' | 'normal' | 'animada', number> = {
  exausta: 3,
  normal: 5,
  animada: 6,
}

type SelectRoutineArgs = {
  ideas: IdeaLite[]
  routines: FlashRoutine[]
  profile: {
    mode: 'single' | 'all'
    children: Array<{ id: string; name?: string; age_bucket: QuickIdeasAgeBucket }>
  }
  filters: {
    locale: QuickIdeasLocation
    time_window_min: number
    energy: 'exausta' | 'normal' | 'animada'
  }
  dateKey: string
}

type RoutineResult = {
  routine: FlashRoutine
  source: 'cms' | 'composed' | 'fallback'
}

const consolidateStrings = (values: string[] | undefined): string[] => {
  if (!values || values.length === 0) {
    return []
  }
  const seen = new Set<string>()
  const result: string[] = []
  values.forEach((value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    const normalized = trimmed.toLocaleLowerCase('pt-BR')
    if (seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    result.push(trimmed)
  })
  return result
}

const consolidateMaterials = (steps: IdeaLite[]): string[] => {
  const all: string[] = []
  steps.forEach((idea) => {
    all.push(...(idea.materials ?? []))
  })
  return consolidateStrings(all)
}

const consolidateSafetyNotes = (steps: IdeaLite[], extra?: string[]): string[] => {
  const all: string[] = []
  steps.forEach((idea) => {
    if (idea.safetyNotes) {
      all.push(...idea.safetyNotes)
    }
  })
  if (extra) {
    all.push(...extra)
  }
  return consolidateStrings(all)
}

const rotateByDate = <T>(items: T[], seed: string): T[] => {
  if (items.length === 0) {
    return items
  }
  const offset = fnv1a(seed) % items.length
  if (offset === 0) {
    return items
  }
  return [...items.slice(offset), ...items.slice(0, offset)]
}

const selectTargetBucket = (
  mode: 'single' | 'all',
  children: Array<{ id: string; age_bucket: QuickIdeasAgeBucket }>
): QuickIdeasAgeBucket => {
  if (children.length === 0) {
    return '2-3'
  }
  if (mode === 'single') {
    const first = children[0]
    return first.age_bucket
  }
  return youngestBucket(children)
}

const pickCmsRoutine = (
  routines: FlashRoutine[],
  bucket: QuickIdeasAgeBucket,
  locale: QuickIdeasLocation,
  maxMinutes: number,
  seed: string
): FlashRoutine | null => {
  const pool = routines.filter(
    (routine) =>
      routine.active &&
      routine.ageBucket === bucket &&
      routine.locale === locale &&
      routine.totalMin <= Math.max(20, maxMinutes)
  )

  if (pool.length === 0) {
    return null
  }

  const rotated = rotateByDate(pool, seed)
  return rotated[0] ?? null
}

const filterIdeas = (
  ideas: IdeaLite[],
  bucket: QuickIdeasAgeBucket,
  locale: QuickIdeasLocation,
  energy: 'exausta' | 'normal' | 'animada'
): IdeaLite[] => {
  const pool = ideas.filter((idea) => idea.ageBuckets.includes(bucket) && idea.locales.includes(locale))
  if (pool.length === 0) {
    return ideas.filter((idea) => idea.locales.includes(locale))
  }

  const maxMaterials = ENERGY_MAX_MATERIALS[energy]
  return pool.sort((a, b) => (a.materials.length ?? 0) - (b.materials.length ?? 0)).slice(0, 12)
}

const composeRoutineFromIdeas = (
  ideas: IdeaLite[],
  bucket: QuickIdeasAgeBucket,
  locale: QuickIdeasLocation,
  energy: 'exausta' | 'normal' | 'animada',
  dateKey: string
): RoutineResult | null => {
  if (ideas.length === 0) {
    return null
  }

  const rotated = rotateByDate(ideas, `${dateKey}:${bucket}:${locale}`)
  const stepsIdeas = rotated.slice(0, 3)

  if (stepsIdeas.length < 3) {
    return null
  }

  const minutesPattern = ENERGY_STEP_MINUTES[energy]
  const steps: FlashRoutineStep[] = stepsIdeas.map((idea, index) => ({
    title: idea.title,
    minutes: minutesPattern[index] ?? 5,
    ideaId: idea.id,
  }))

  const totalMin = steps.reduce((acc, step) => acc + step.minutes, 0)
  const materials = consolidateMaterials(stepsIdeas)
  const safetyNotes = consolidateSafetyNotes(stepsIdeas)

  const routine: FlashRoutine = {
    id: `routine-composed-${bucket}-${locale}`,
    title: `Rotina ${LOCALE_LABEL[locale]} ${totalMin}’`,
    totalMin,
    steps,
    ageBucket: bucket,
    locale,
    materials,
    safetyNotes: safetyNotes.length > 0 ? safetyNotes : undefined,
    active: true,
  }

  return { routine, source: 'composed' }
}

const fallbackRoutine = (
  bucket: QuickIdeasAgeBucket,
  locale: QuickIdeasLocation,
  energy: 'exausta' | 'normal' | 'animada'
): RoutineResult => {
  const minutesPattern = ENERGY_STEP_MINUTES[energy]
  const steps: FlashRoutineStep[] = [
    { title: 'Respirar e alongar juntas', minutes: minutesPattern[0], ideaId: undefined },
    { title: 'Explorar objetos favoritos', minutes: minutesPattern[1], ideaId: undefined },
    { title: 'Compartilhar gratidão do dia', minutes: minutesPattern[2], ideaId: undefined },
  ]

  const totalMin = steps.reduce((acc, step) => acc + step.minutes, 0)

  const routine: FlashRoutine = {
    id: `routine-fallback-${bucket}-${locale}`,
    title: `Rotina Aconchego ${totalMin}’`,
    totalMin,
    steps,
    ageBucket: bucket,
    locale,
    materials: ['tapete confortável', 'dois brinquedos seguros', 'caderno ou folha'],
    safetyNotes: ['Supervisione peças pequenas e ajuste à idade.'],
    active: true,
  }

  return { routine, source: 'fallback' }
}

export const selectFlashRoutine = ({ ideas, routines, profile, filters, dateKey }: SelectRoutineArgs): RoutineResult => {
  const targetBucket = selectTargetBucket(profile.mode, profile.children)
  const locale = filters.locale
  const energy = filters.energy
  const seed = `${dateKey}:${targetBucket}:${locale}`

  const cmsRoutine = pickCmsRoutine(routines, targetBucket, locale, filters.time_window_min, seed)
  if (cmsRoutine) {
    return { routine: cmsRoutine, source: 'cms' }
  }

  const ideaPool = filterIdeas(ideas, targetBucket, locale, energy)
  const composed = composeRoutineFromIdeas(ideaPool, targetBucket, locale, energy, dateKey)
  if (composed) {
    return composed
  }

  return fallbackRoutine(targetBucket, locale, energy)
}
