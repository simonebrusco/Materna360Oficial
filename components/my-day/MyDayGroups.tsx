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

function sortForGroup(items: MyDayTaskItem[], opts: { premium: boolean; dateKey: string; persona?: PersonaId }) {
  const { premium, persona } = opts

  const statusRank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2
  }

  const started = (t: MyDayTaskItem) => {
    const anyT: any = t as any
    return !!(anyT.startedAt || anyT.inProgress === true || (typeof anyT.progress === 'number' && anyT.progress > 0))
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

  /* =========================
     ✅ P19.2 — Micro-memória
  ========================= */

  const recentSignal = useMemo(() => {
    if (!premium) return null
    return getRecentMyDaySignal(dateKey)
  }, [premium, dateKey])

  /* =========================
     Densidade final (ajustada)
  ========================= */

  const effectiveLimit = useMemo(() => {
    const raw = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (!premium) return Math.max(5, Math.min(6, resolved))

    const { min, max } = getAdaptivePremiumLimit(personaId)

    // ajuste sutil baseado em micro-histórico
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

  /* =========================
     ✅ P9 — Consumir sinal pós-salvar
<<<<<<< Updated upstream
     - só no Premium (evita comportamento colateral no Free)
     - abre o grupo certo
     - marca "ativo" por poucos segundos
     - remove a key para não repetir
     - reavalia por dateKey (troca de dia)
=======
     - abre o grupo certo
     - marca "ativo" por poucos segundos
     - remove a key para não repetir
>>>>>>> Stashed changes
  ========================= */

  useEffect(() => {
    try {
<<<<<<< Updated upstream
      if (!premium) {
        setRecentSaveActive(false)
        setHighlightGroup(null)
        return
      }

=======
>>>>>>> Stashed changes
      const raw = safeGetLS(LS_RECENT_SAVE)
      if (!raw) return

      const payload = safeParseJSON<RecentSavePayload>(raw)
      safeRemoveLS(LS_RECENT_SAVE) // consumir sempre, mesmo se inválido

      if (!payload || typeof payload.ts !== 'number' || !payload.origin) return

      // janela curta para evitar efeito atrasado (UX)
      const ageMs = Date.now() - payload.ts
<<<<<<< Updated upstream
      if (ageMs < 0 || ageMs > 12_000) return
=======
      if (ageMs < 0 || ageMs > 10 * 60 * 1000) return
>>>>>>> Stashed changes

      const gid = groupIdFromRecentOrigin(payload.origin)
      setHighlightGroup(gid)

      // abre o bloco automaticamente (sem texto, sem CTA)
      setExpanded((prev) => ({ ...prev, [gid]: true }))

<<<<<<< Updated upstream
      // marca ativo por um curto período para P20 não empilhar micro-frase
      setRecentSaveActive(true)
      const t = window.setTimeout(() => setRecentSaveActive(false), 12_000)
=======
      // marca ativo por curto período para P20 não empilhar micro-frase
      setRecentSaveActive(true)
      window.setTimeout(() => setRecentSaveActive(false), 2600)
>>>>>>> Stashed changes

      try {
        track('my_day.recent_save.consumed', {
          origin: payload.origin,
          source: payload.source ?? null,
          ageMs,
        })
      } catch {}
<<<<<<< Updated upstream

      return () => window.clearTimeout(t)
    } catch {
      // silencioso
    }
  }, [premium, dateKey])
=======
    } catch {
      // silencioso
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
>>>>>>> Stashed changes

  /* =========================
     ✅ P20 — Silêncio inteligente (timing)
     - Free: intacto (mantém base)
     - Premium: só mostra quando faz sentido humano
       + não empilha com pós-salvar
  ========================= */

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

      // ✅ P20: se acabou de salvar, não empilha micro-frase
      if (recentSaveActive) {
        setContinuityLine(null)
        return
      }

<<<<<<< Updated upstream
      // 1) Se o dia está vazio, silêncio.
=======
>>>>>>> Stashed changes
      if (totalCount === 0) {
        setContinuityLine(null)
        return
      }

<<<<<<< Updated upstream
      // 2) Se não há pressão e não houve ação recente, silêncio.
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  /* =========================
     RENDER — ORIGINAL
     (Você mantém seu JSX real aqui. Eu não invento markup.)
  ========================= */

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {/* JSX ORIGINAL — permanece exatamente igual ao que você já tem no seu projeto */}
      {/* Importante: onde você renderiza grupos, você já tem acesso a:
=======
  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {/* JSX ORIGINAL — permanece exatamente igual ao que você já tem no seu projeto */}
      {/* Você já tem acesso a:
>>>>>>> Stashed changes
          - grouped
          - expanded / setExpanded
          - effectiveLimit
          - continuityLine
<<<<<<< Updated upstream
          - highlightGroup (se quiser usar só para um "ring" sutil existente; não é obrigatório)
=======
          - highlightGroup (se quiser aplicar só um destaque sutil já existente; opcional)
>>>>>>> Stashed changes
      */}
    </section>
  )
}
