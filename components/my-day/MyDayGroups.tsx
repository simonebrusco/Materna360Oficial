'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

import { track } from '@/app/lib/telemetry'
import {
  groupTasks,
  listMyDayTasks,
  removeTask,
  snoozeTask,
  toggleDone,
  unsnoozeTask,
  type GroupedTasks,
  type MyDayTaskItem,
} from '@/app/lib/myDayTasks.client'
import type { AiLightContext } from '@/app/lib/ai/buildAiContext'
import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { isPremium } from '@/app/lib/plan'

type GroupId = keyof GroupedTasks
type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

feature/p18-ajustes-adaptativos-meu-dia-por-estado
/* =========================
   Helpers base (inalterados)
========================= */
=======
const LS_RECENT_SAVE = 'my_day_recent_save_v1'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'
type RecentSavePayload = { ts: number; origin: TaskOrigin; source: string }

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}


function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  if ((t as any).status) return (t as any).status
  if ((t as any).done === true) return 'done'
  return 'active'
}

function timeOf(t: MyDayTaskItem): number {
  const iso = (t as any).createdAt
  const n = iso ? Date.parse(iso) : NaN
  return Number.isFinite(n) ? n : 0
}

feature/p18-ajustes-adaptativos-meu-dia-por-estado
/* =========================
   P18 — Densidade adaptativa
========================= */

function getAdaptivePremiumLimit(persona?: PersonaId) {
  switch (persona) {
    case 'sobrevivencia':
      return { min: 2, max: 3 }
    case 'organizacao':
      return { min: 3, max: 3 }
    case 'conexao':
    case 'equilibrio':
      return { min: 3, max: 4 }
    case 'expansao':
      return { min: 4, max: 4 }
    default:
      return { min: 3, max: 4 }
  }

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')

}

/* =========================
   P18 — Ordenação contextual
========================= */

feature/p18-ajustes-adaptativos-meu-dia-por-estado
function sortForGroup(
  items: MyDayTaskItem[],
  opts: { premium: boolean; persona?: PersonaId },
) {
  const { premium, persona } = opts

  const statusRank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2

function getPersonaId(aiContext?: AiLightContext): string | undefined {
  const p: any = (aiContext as any)?.persona
  if (!p) return undefined
  if (typeof p === 'string') return p
  if (typeof p === 'object' && typeof p.persona === 'string') return p.persona
  return undefined
}

/* ======================================================
   P18 — MAPAS ADAPTATIVOS (SILENCIOSOS)
====================================================== */

type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

function adaptivePremiumLimit(persona?: PersonaId) {
  switch (persona) {
    case 'sobrevivencia':
      return { min: 2, max: 3 }
    case 'organizacao':
      return { min: 3, max: 3 }
    case 'conexao':
    case 'equilibrio':
      return { min: 3, max: 4 }
    case 'expansao':
      return { min: 4, max: 4 }
    default:
      return { min: 3, max: 4 }

  }
}

feature/p18-ajustes-adaptativos-meu-dia-por-estado
  const started = (t: MyDayTaskItem) => {
    const anyT: any = t as any
    return !!(
      anyT.startedAt ||
      anyT.inProgress ||
      (typeof anyT.progress === 'number' && anyT.progress > 0)
    )
  }

  const personaRank = (t: MyDayTaskItem) => {
    if (!premium) return 0

    if (persona === 'sobrevivencia' || persona === 'organizacao') {
      if (started(t)) return 0
    }


/* ======================================================
   ORDENAÇÃO CONTEXTUAL (P18.2)
====================================================== */

function sortForGroup(
  items: MyDayTaskItem[],
  opts: { premium: boolean; dateKey: string; persona?: PersonaId },
) {
  const { premium, dateKey, persona } = opts

  const statusRank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2
  }

  const started = (t: MyDayTaskItem) => {
    const anyT: any = t as any
    return !!(anyT.startedAt || anyT.inProgress || (typeof anyT.progress === 'number' && anyT.progress > 0))
  }

  const premiumRank = (t: MyDayTaskItem) => {
    if (!premium) return 0

    if (persona === 'sobrevivencia') {
      if (started(t)) return 0
    }

    if (persona === 'organizacao') {
      if (started(t)) return 0
    }


    return 1
  }

  return [...items].sort((a, b) => {
    if (premium) {
feature/p18-ajustes-adaptativos-meu-dia-por-estado
      const pa = personaRank(a)
      const pb = personaRank(b)

      const pa = premiumRank(a)
      const pb = premiumRank(b)

      if (pa !== pb) return pa - pb
    }

    const ra = statusRank(a)
    const rb = statusRank(b)
    if (ra !== rb) return ra - rb

    return premium ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b)
  })
}

feature/p18-ajustes-adaptativos-meu-dia-por-estado
/* =========================
   P18 — Continuidade adaptada
========================= */

function refineContinuityForPremium(dateKey: string, persona?: PersonaId) {
  const variants: Record<PersonaId, string[]> = {
    sobrevivencia: ['Hoje, menos já é suficiente.', 'Um passo já é muito.'],
    organizacao: ['Escolher o essencial clareia o dia.'],
    conexao: ['Pequenas presenças mudam o clima.'],
    equilibrio: ['Seguir no seu ritmo já é constância.'],
    expansao: ['Use essa energia com foco.', 'Avançar com clareza sustenta mais.'],

/* ======================================================
   CONTINUIDADE ADAPTATIVA (P18.3)
====================================================== */

function refineContinuityForPremium(dateKey: string, persona?: PersonaId) {
  const variants: Record<PersonaId, string[]> = {
    sobrevivencia: [
      'Hoje, menos já é suficiente.',
      'Um passo já é muito.',
    ],
    organizacao: [
      'Escolher o essencial clareia o dia.',
      'Um ponto de cada vez organiza tudo.',
    ],
    conexao: [
      'Pequenas presenças mudam o clima.',
    ],
    equilibrio: [
      'Seguir no seu ritmo já é constância.',
    ],
    expansao: [
      'Use essa energia com foco.',
      'Avançar com clareza sustenta mais.',
    ],

  }

  const list = (persona && variants[persona]) || variants.equilibrio
  let acc = 0
feature/p18-ajustes-adaptativos-meu-dia-por-estado
  for (let i = 0; i < dateKey.length; i++) {
    acc = (acc + dateKey.charCodeAt(i) * (i + 1)) % 10_000
  }

  for (let i = 0; i < dateKey.length; i++) acc = (acc + dateKey.charCodeAt(i) * (i + 1)) % 10_000

  return list[acc % list.length]
}

/* =========================
   COMPONENTE
========================= */

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
feature/p18-ajustes-adaptativos-meu-dia-por-estado

  const [recentBanner, setRecentBanner] = useState(false)
  const [highlightGroup, setHighlightGroup] = useState<GroupId | null>(null)

  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [continuityLine, setContinuityLine] = useState<string | null>(null)
  const [premium, setPremium] = useState(false)

  const dateKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const totalCount = tasks.length

  const personaId = euSignal.personaId as PersonaId | undefined

  /* ===== Densidade ===== */

feature/p18-ajustes-adaptativos-meu-dia-por-estado
  const effectiveLimit = useMemo(() => {
    const raw = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (!premium) return Math.max(5, Math.min(6, resolved))

  const personaId = euSignal.personaId as PersonaId | undefined

  const effectiveLimit = useMemo(() => {
    const raw = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (!premium) return Math.max(5, Math.min(6, resolved))

    const { min, max } = adaptivePremiumLimit(personaId)
    return Math.max(min, Math.min(max, resolved))
  }, [euSignal, premium, personaId])


    const { min, max } = getAdaptivePremiumLimit(personaId)
    return Math.max(min, Math.min(max, resolved))
  }, [euSignal, premium, personaId])

  /* ===== Lifecycle ===== */

  useEffect(() => {
    setTasks(listMyDayTasks())
  }, [])

  useEffect(() => {
    const sync = () => {
      try {
        setPremium(isPremium())
      } catch {
        setPremium(false)
      }
    }
    sync()
    window.addEventListener('m360:plan-updated', sync as EventListener)
    return () => window.removeEventListener('m360:plan-updated', sync as EventListener)
  }, [])

  useEffect(() => {
    setEuSignal(getEu360Signal())
  }, [])

feature/p18-ajustes-adaptativos-meu-dia-por-estado
  /* ===== Telemetria P18 ===== */

  const adaptiveTrackedRef = React.useRef<string | null>(null)
  useEffect(() => {
    if (!premium) return
    if (adaptiveTrackedRef.current === dateKey) return
    adaptiveTrackedRef.current = dateKey

    track('adaptive_day_applied', {
      tab: 'meu-dia',
      tone: personaId ?? null,
      timestamp: new Date().toISOString(),
    })
  }, [premium, dateKey, personaId])

  /* ===== Continuidade ===== */

  useEffect(() => {
    try {
      const tone = (euSignal?.tone ?? 'gentil') as NonNullable<Eu360Signal['tone']>
      const base = getMyDayContinuityLine({ dateKey, tone })
      if (!base?.text) {
        setContinuityLine(null)
        return
      }
      setContinuityLine(premium ? refineContinuityForPremium(dateKey, personaId) : base.text)

  useEffect(() => {
    refresh()
  }, [])

  const adaptiveTrackedRef = React.useRef<string | null>(null)
  useEffect(() => {
    if (!premium) return
    if (adaptiveTrackedRef.current === dateKey) return
    adaptiveTrackedRef.current = dateKey

    track('adaptive_day_applied', {
      tab: 'meu-dia',
      tone: personaId ?? null,
      timestamp: new Date().toISOString(),
    })
  }, [premium, dateKey, personaId])

  useEffect(() => {
    try {
      const tone = (euSignal?.tone ?? 'gentil') as NonNullable<Eu360Signal['tone']>
      const line = getMyDayContinuityLine({ dateKey, tone })
      if (!line?.text) {
        setContinuityLine(null)
        return
      }
      setContinuityLine(premium ? refineContinuityForPremium(dateKey, personaId) : line.text)

    } catch {
      setContinuityLine(null)
    }
  }, [dateKey, euSignal?.tone, premium, personaId])
feature/p18-ajustes-adaptativos-meu-dia-por-estado

  /* ===== RENDER (INALTERADO) ===== */

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">


  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {/* restante do render permanece inalterado */}

      {GROUP_ORDER.map((groupId) => {
        const group = grouped[groupId]
        if (!group || group.items.length === 0) return null

feature/p18-ajustes-adaptativos-meu-dia-por-estado
        const sorted = sortForGroup(group.items, { premium, persona: personaId })

        const sorted = sortForGroup(group.items, { premium, dateKey, persona: personaId })

        const isExpanded = !!expanded[groupId]
        const visible = isExpanded ? sorted : sorted.slice(0, effectiveLimit)

        return (
          <div key={groupId}>
            {visible.map((t) => (
              <div key={t.id}>{t.title}</div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
