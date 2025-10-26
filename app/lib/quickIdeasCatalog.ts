import { QUICK_IDEAS_CATALOG } from '@/app/data/quickIdeasCatalog'
import {
  type QuickIdea,
  type QuickIdeaCatalogEntry,
  type QuickIdeasAgeBucket,
  type QuickIdeasEnergy,
  type QuickIdeasLocation,
  type QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'

export type QuickIdeaFilters = {
  location: QuickIdeasLocation
  time_window_min: QuickIdeasTimeWindow
  energy: QuickIdeasEnergy
}

export type DiscoverChild = {
  id: string
  name?: string
  age_bucket: QuickIdeasAgeBucket
}

export type DiscoverProfile = {
  mode: 'single' | 'all'
  activeChildId?: string | null
  children: DiscoverChild[]
}

export type DailySuggestion = {
  idea: QuickIdeaCatalogEntry
  child?: DiscoverChild
}

const AGE_BUCKET_ORDER: QuickIdeasAgeBucket[] = ['0-1', '2-3', '4-5', '6-7', '8+']
const AGE_BUCKET_SET = new Set<QuickIdeasAgeBucket>(AGE_BUCKET_ORDER)

const SAFE_DEFAULT_IDEA: QuickIdeaCatalogEntry = {
  id: 'casa-respiro-bolinhas',
  title: 'Bolhas de Respiração Calminha',
  summary: 'Façam respirações lentas soprando bolhas pertinho de uma tigela com espuma.',
  time_total_min: 5,
  location: 'casa',
  materials: ['tigela pequena', 'água morna', 'detergente neutro', 'canudo grosso reutilizável'],
  steps: [
    'Misture a água morna com uma gota de detergente na tigela para formar bolhinhas.',
    'Inspire pelo nariz e sopre suave pelo canudo para criar bolhas calmas juntos.',
  ],
  age_adaptations: {
    '0-1': 'Sente o bebê no colo e sopre você mesma, deixando-o tocar bolhas grandes com a mão.',
    '2-3': 'Ajude a segurar o canudo e contar até três antes de soprar devagar.',
    '4-5': 'Proponha desenhar figuras na espuma usando o dedo indicador.',
    '6-7': 'Crie desafios de soprar bolha maior e estourar com o dedo mindinho.',
    '8+': 'Inclua respirações 4-6: inspire em 4 tempos e solte em 6 soprando as bolhas.',
  },
  safety_notes: [
    'Use canudo grosso ou reutilizável para reduzir risco de engolir líquido.',
    'Supervisione o uso do detergente e lave as mãos ao final.',
  ],
  badges: ['curta', 'sensorial'],
  planner_payload: {
    type: 'idea',
    duration_min: 5,
    materials: ['tigela pequena', 'água morna', 'detergente neutro', 'canudo grosso reutilizável'],
  },
  rationale: 'Fallback seguro: poucos passos em casa, acalma respiração e cabe em 5 minutos.',
  ageBuckets: ['0-1', '2-3', '4-5', '6-7', '8+'],
  suitableEnergies: ['exausta', 'normal'],
}

const FRIENDLY_LOCATION: Record<QuickIdeasLocation, string> = {
  casa: 'Casa',
  parque: 'Parque',
  escola: 'Escola',
  area_externa: 'Área externa',
}

const FRIENDLY_ENERGY: Record<QuickIdeasEnergy, string> = {
  exausta: 'energia baixa',
  normal: 'energia estável',
  animada: 'energia alta',
}

export const friendlyLocationLabel = (location: QuickIdeasLocation): string => FRIENDLY_LOCATION[location]
export const friendlyEnergyLabel = (energy: QuickIdeasEnergy): string => FRIENDLY_ENERGY[energy]

const sanitizeTimeWindow = (value: number): QuickIdeasTimeWindow => {
  if (value <= 5) {
    return 5
  }
  if (value <= 10) {
    return 10
  }
  return 20
}

const sanitizeAgeBucket = (value?: string | null): QuickIdeasAgeBucket => {
  if (!value) {
    return '2-3'
  }
  const normalized = value.trim() as QuickIdeasAgeBucket
  return AGE_BUCKET_SET.has(normalized) ? normalized : '2-3'
}

const sanitizeChild = (child: DiscoverChild, index: number): DiscoverChild => {
  const id = child.id?.trim() || `child-${index + 1}`
  const safeName = child.name?.trim()
  return {
    id,
    name: safeName && safeName.length > 0 ? safeName : `Criança ${index + 1}`,
    age_bucket: sanitizeAgeBucket(child.age_bucket),
  }
}

const ensureChildren = (children: DiscoverChild[]): DiscoverChild[] => {
  if (!children || children.length === 0) {
    return [{ id: 'fallback-child', name: 'Criança', age_bucket: '2-3' }]
  }

  const seen = new Set<string>()
  const sanitized: DiscoverChild[] = []

  children.forEach((child, index) => {
    const normalized = sanitizeChild(child, index)
    if (!seen.has(normalized.id)) {
      seen.add(normalized.id)
      sanitized.push(normalized)
    }
  })

  return sanitized.length > 0 ? sanitized : [{ id: 'fallback-child', name: 'Criança', age_bucket: '2-3' }]
}

const fnv1a = (value: string): number => {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return hash >>> 0
}

const filterCatalogForChild = (
  catalog: QuickIdeaCatalogEntry[],
  ageBucket: QuickIdeasAgeBucket,
  filters: QuickIdeaFilters
): QuickIdeaCatalogEntry[] => {
  const base = catalog.filter((idea) => idea.ageBuckets.includes(ageBucket))
  if (base.length === 0) {
    return []
  }

  const byEnergy = base.filter((idea) => idea.suitableEnergies.includes(filters.energy))
  const withEnergy = byEnergy.length > 0 ? byEnergy : base

  const byLocation = withEnergy.filter((idea) => idea.location === filters.location)
  const withLocation = byLocation.length > 0 ? byLocation : withEnergy

  const byTime = withLocation.filter((idea) => idea.time_total_min <= filters.time_window_min)
  if (byTime.length > 0) {
    return byTime
  }

  const relaxTime = withLocation
  if (relaxTime.length > 0) {
    return relaxTime
  }

  const fallbackWithTime = withEnergy.filter((idea) => idea.time_total_min <= filters.time_window_min)
  if (fallbackWithTime.length > 0) {
    return fallbackWithTime
  }

  const byBaseTime = base.filter((idea) => idea.time_total_min <= filters.time_window_min)
  if (byBaseTime.length > 0) {
    return byBaseTime
  }

  return withLocation.length > 0 ? withLocation : base
}

const fallbackIdeaForBucket = (
  catalog: QuickIdeaCatalogEntry[],
  bucket: QuickIdeasAgeBucket
): QuickIdeaCatalogEntry => {
  if (catalog.length === 0) {
    return SAFE_DEFAULT_IDEA
  }
  return catalog.find((idea) => idea.ageBuckets.includes(bucket)) ?? catalog[0]
}

const pickIdea = (
  pool: QuickIdeaCatalogEntry[],
  bucket: QuickIdeasAgeBucket,
  catalog: QuickIdeaCatalogEntry[],
  hashKey: string
): QuickIdeaCatalogEntry => {
  if (pool.length === 0) {
    return fallbackIdeaForBucket(catalog, bucket)
  }

  const hash = fnv1a(hashKey)
  const index = hash % pool.length
  return pool[index]
}

const selectChildrenForMode = (
  children: DiscoverChild[],
  mode: 'single' | 'all',
  activeChildId?: string | null
): DiscoverChild[] => {
  if (mode === 'all') {
    return children
  }

  if (activeChildId) {
    const match = children.find((child) => child.id === activeChildId)
    if (match) {
      return [match]
    }
  }

  return [children[0]]
}

export const youngestBucket = (children: DiscoverChild[]): QuickIdeasAgeBucket => {
  if (children.length === 0) {
    return '2-3'
  }
  const ordered = [...children].sort(
    (a, b) => AGE_BUCKET_ORDER.indexOf(a.age_bucket) - AGE_BUCKET_ORDER.indexOf(b.age_bucket)
  )
  return ordered[0]?.age_bucket ?? '2-3'
}

export const buildDailySuggestions = (
  profile: DiscoverProfile,
  filtersInput: QuickIdeaFilters,
  dateKey: string,
  catalog: QuickIdeaCatalogEntry[] = QUICK_IDEAS_CATALOG
): DailySuggestion[] => {
  const sanitizedFilters: QuickIdeaFilters = {
    location: filtersInput.location,
    energy: filtersInput.energy,
    time_window_min: sanitizeTimeWindow(filtersInput.time_window_min),
  }

  const normalizedChildren = ensureChildren(profile.children)
  const selectedChildren = selectChildrenForMode(normalizedChildren, profile.mode, profile.activeChildId)

  return selectedChildren.map((child) => {
    const pool = filterCatalogForChild(catalog, child.age_bucket, sanitizedFilters)
    const key = `${dateKey}:${child.id}:${sanitizedFilters.location}:${sanitizedFilters.time_window_min}`
    const idea = pickIdea(pool, child.age_bucket, catalog, key)
    return {
      idea,
      child,
    }
  })
}

export const consolidateMaterials = (ideas: QuickIdea[]): string[] => {
  const seen = new Set<string>()
  const output: string[] = []

  ideas.forEach((idea) => {
    idea.materials.forEach((material) => {
      const normalized = material.trim().toLocaleLowerCase('pt-BR')
      if (!normalized || seen.has(normalized)) {
        return
      }
      seen.add(normalized)
      output.push(material.trim())
    })
  })

  return output
}
