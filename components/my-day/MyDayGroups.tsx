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
import { getRecentMyDaySignal } from '@/app/lib/myDayMemory.client' // ✅ P19.2

type GroupId = keyof GroupedTasks
type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

// ✅ P9 — sinal pós-salvar vindo do Meu Dia Leve
const LS_RECENT_SAVE = 'my_day_recent_save_v1'
type RecentSaveOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'
type RecentSavePayload = { ts: number; origin: RecentSaveOrigin; source: string }

/* =========================
   Helpers base
========================= */

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

function groupIdFromRecentOrigin(origin: RecentSaveOrigin): GroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

/* =========================
   Persona segura
========================= */

function getPersonaId(aiContext?: AiLightContext): PersonaId | undefined {
  const p: any = (aiContext as any)?.persona
  if (
    p === 'sobrevivencia' ||
    p === 'organizacao' ||
    p === 'conexao' ||
    p === 'equilibrio' ||
    p === 'expansao'
  ) {
    return p
  }
  if (
    typeof p === 'object' &&
    (p.persona === 'sobrevivencia' ||
      p.persona === 'organizacao' ||
      p.persona === 'conexao' ||
      p.persona === 'equilibrio' ||
      p.persona === 'expansao')
  ) {
    return p.persona
  }
  return undefined
}

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
}

/* =========================
   P18 — Ordenação contextual
========================= */

function sortForGroup(
  items: MyDayTaskItem[],
  opts: { premium: boolean; dateKey: string; persona?: PersonaId },
) {
  const { premium, persona } = opts

  const statusRank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2
  }

  const started = (t: MyDayTaskItem) => {
    const anyT: any = t as any
    return !!(
      anyT.startedAt ||
      anyT.inProgress === true ||
      (typeof anyT.progress === 'number' && anyT.progress > 0)
    )
  }

  return [...items].sort((a, b) => {
    if (premium && (persona === 'sobrevivencia' || persona === 'organizacao')) {
      const sa = started(a)
      const sb = started(b)
      if (sa !== sb) return sa ? -1 : 1
    }

    const ra = statusRank(a)
    const rb = statusRank(b)
    if (ra !== rb) return ra - rb

    return premium ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b)
  })
}

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
  }

  const list = (persona && variants[persona]) || variants.equilibrio
  let acc = 0
  for (let i = 0; i < dateKey.length; i++) {
    acc = (acc + dateKey.charCodeAt(i) * (i + 1)) % 10_000
  }
  return list[acc % list.length]
}

/* =========================
   COMPONENTE
========================= */

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [continuityLine, setContinuityLine] = useState<string | null>(null)
  const [premium, setPremium] = useState(false)

  // ✅ P9 — pós-salvar (sem criar UI nova)
  const [recentSaveActive, setRecentSaveActive] = useState(false)
  const [highlightGroup, setHighlightGroup] = useState<GroupId | null>(null)

  const dateKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const personaId = getPersonaId(aiContext)

  const totalCount = tasks.length

  const recentSignal = useMemo(() => {
    if (!premium) return null
    return getRecentMyDaySignal(dateKey)
  }, [premium, dateKey])

  const effectiveLimit = useMemo(() => {
    const raw = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (!premium) return Math.max(5, Math.min(6, resolved))

    const { min, max } = getAdaptivePremiumLimit(personaId)

    if (recentSignal?.pendingPressure === 'high') {
      return Math.max(min, Math.min(max, resolved - 1))
    }

    return Math.max(min, Math.min(max, resolved))
  }, [euSignal, premium, personaId, recentSignal])

  function refresh() {
    setTasks(listMyDayTasks())
  }

  useEffect(() => {
    refresh()
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

  useEffect(() => {
    try {
      if (!premium) {
        setRecentSaveActive(false)
        setHighlightGroup(null)
        return
      }

      const raw = safeGetLS(LS_RECENT_SAVE)
      if (!raw) return

      const payload = safeParseJSON<RecentSavePayload>(raw)
      safeRemoveLS(LS_RECENT_SAVE)

      if (!payload || typeof payload.ts !== 'number' || !payload.origin) return

      const ageMs = Date.now() - payload.ts
      if (ageMs < 0 || ageMs > 12_000) return

      const gid = groupIdFromRecentOrigin(payload.origin)
      setHighlightGroup(gid)
      setExpanded((prev) => ({ ...prev, [gid]: true }))

      setRecentSaveActive(true)
      const t = window.setTimeout(() => {
        setRecentSaveActive(false)
        setHighlightGroup(null)
      }, 2600)

      try {
        track('my_day.recent_save.consumed', {
          origin: payload.origin,
          source: payload.source ?? null,
          ageMs,
        })
      } catch {}

      return () => window.clearTimeout(t)
    } catch {
      // silencioso
    }
  }, [premium])

  useEffect(() => {
    try {
      const tone = (euSignal?.tone ?? 'gentil') as NonNullable<Eu360Signal['tone']>

      const base = getMyDayContinuityLine({ dateKey, tone })
      if (!base?.text) {
        setContinuityLine(null)
        return
      }

      if (!premium) {
        setContinuityLine(base.text)
        return
      }

      if (recentSaveActive) {
        setContinuityLine(null)
        return
      }

      if (totalCount === 0) {
        setContinuityLine(null)
        return
      }

      if (recentSignal?.pendingPressure === 'low' && recentSignal?.hadCompletionRecently === false) {
        setContinuityLine(null)
        return
      }

      setContinuityLine(refineContinuityForPremium(dateKey, personaId))
    } catch {
      setContinuityLine(null)
    }
  }, [
    dateKey,
    euSignal?.tone,
    premium,
    personaId,
    totalCount,
    recentSignal?.pendingPressure,
    recentSignal?.hadCompletionRecently,
    recentSaveActive,
  ])

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {GROUP_ORDER.map((groupId) => {
        const group = grouped[groupId]
        if (!group || group.items.length === 0) return null

        const sorted = sortForGroup(group.items, { premium, dateKey, persona: personaId })
        const isExpanded = !!expanded[groupId]
        const visible = isExpanded ? sorted : sorted.slice(0, effectiveLimit)

        // ✅ P21 — destaque sutil pós-salvar (sem texto, sem CTA, sem “alerta”)
        const shouldHighlight = premium && recentSaveActive && highlightGroup === groupId

        return (
          <div
            key={groupId}
            className={[
              'transition-[box-shadow,background-color] duration-700 ease-out',
              shouldHighlight ? 'bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.28)]' : '',
            ].join(' ')}
          >
            {visible.map((t) => (
              <div key={t.id}>{t.title}</div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
