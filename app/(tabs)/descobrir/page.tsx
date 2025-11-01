// app/(tabs)/descobrir/page.tsx
import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'
import DescobrirClient from './Client'

// Configurações de render do Next (server component)
export const dynamic = 'force-dynamic'
export const revalidate = 0 as const
export const fetchCache = 'force-no-store' as const

// Tipos simples para evitar conflitos
type SearchParams = Record<string, string | string[] | undefined>
type QuickIdeasLocation = 'casa' | 'parque' | 'escola' | 'area_externa'
type QuickIdeasEnergy = 'exausta' | 'normal' | 'animada'
type QuickIdeasTimeWindow = 2 | 5 | 10
type QuickIdeasAgeBucket = '0-1' | '2-3' | '4-5' | '6-7' | '8+'

// Rotulagem usada pelo client (mantém o layout)
const LOCATION_LABEL: Record<QuickIdeasLocation, string> = {
  casa: 'Casa',
  parque: 'Parque',
  escola: 'Escola',
  area_externa: 'Área Externa',
}

// Sanitizadores mínimos (sem dependências externas)
const sanitizeLocation = (v?: string | null): QuickIdeasLocation => {
  const x = (v || '').trim().toLowerCase()
  return (['casa', 'parque', 'escola', 'area_externa'] as QuickIdeasLocation[]).includes(x as any)
    ? (x as QuickIdeasLocation)
    : 'casa'
}
const sanitizeEnergy = (v?: string | null): QuickIdeasEnergy => {
  const x = (v || '').trim().toLowerCase()
  return (['exausta', 'normal', 'animada'] as QuickIdeasEnergy[]).includes(x as any)
    ? (x as QuickIdeasEnergy)
    : 'normal'
}
const sanitizeTime = (v?: string | null): QuickIdeasTimeWindow => {
  const n = Number(v)
  if (n <= 2) return 2
  if (n <= 5) return 5
  return 10
}

export default async function DescobrirPage({ searchParams }: { searchParams?: SearchParams }) {
  // Desativa cache no servidor (compatível entre versões)
  try { noStore() } catch {}

  // cookies() só para manter o mesmo fluxo server-side (não usamos valores aqui)
  const _jar = cookies()

  // Filtros vindos da URL (seguros)
  const filters = {
    location: sanitizeLocation(typeof searchParams?.location === 'string' ? searchParams.location : undefined),
    energy: sanitizeEnergy(typeof searchParams?.energia === 'string' ? searchParams.energia : undefined),
    time_window_min: sanitizeTime(typeof searchParams?.tempo === 'string' ? searchParams.tempo : undefined),
  } satisfies {
    location: QuickIdeasLocation
    energy: QuickIdeasEnergy
    time_window_min: QuickIdeasTimeWindow
  }

  // Estado mínimo para o client manter o layout
  const dateKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const profile = {
    mode: 'single',
    activeChildId: 'demo-child',
    children: [{ id: 'demo-child', name: 'Luna', age_bucket: '2-3' as QuickIdeasAgeBucket }],
  }

  // Labels iniciais (mesmo padrão que o client espera)
  const initialAgeFilter: QuickIdeasAgeBucket = profile.children[0]?.age_bucket ?? '2-3'
  const initialPlaceFilter = LOCATION_LABEL[filters.location]

  // Props “vazias” porém tipadas — para não quebrar o client.
  // Se o Client exigir chaves específicas, elas estão aqui.
  const props = {
    suggestions: [] as any[], // lista de ideias
    filters,
    dateKey,
    profile,
    initialAgeFilter,
    initialPlaceFilter,
    recShelf: { enabled: false, groups: [] as any[] },
    flashRoutine: {
      enabled: false,
      aiEnabled: false,
      routine: null,
      strategy: null,
      analyticsSource: 'local' as const,
    },
    selfCare: {
      enabled: false,
      aiEnabled: false,
      items: [] as any[],
      energy: filters.energy,
      minutes: filters.time_window_min,
    },
    flags: {
      recShelf: false,
      flashRoutine: false,
      flashRoutineAI: false,
      selfCare: false,
      selfCareAI: false,
    } as Record<string, boolean>,
  }

  // Render normal do Client — mantém o layout/UX da aba
  return <DescobrirClient {...(props as any)} />
}
