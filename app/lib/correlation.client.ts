'use client'

/**
 * Materna360 — P26
 * Core de Correlação (client)
 *
 * Objetivo:
 * - Centralizar a “cola” Eu360 → Maternar → Meu Dia → Minha Jornada
 * - Padronizar origem/source/meta para tarefas e registros
 * - Sem alterar layout, sem criar cobranças, sem bifurcar premium/free
 */

import { getMaternarContext, type MaternarContext, type Focus } from '@/app/lib/context.client'
import { getProfileSnapshot, type ChildSnapshot, type ProfileSnapshot } from '@/app/lib/profile.client'
import { MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export type HubId = 'maternar/meu-dia-leve' | 'maternar/meu-filho' | 'maternar/cuidar-de-mim'

export type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

export type CorrelationMeta = {
  hub: HubId
  // contexto do momento (invisível)
  slot?: MaternarContext['slot']
  mood?: MaternarContext['mood']
  focus?: MaternarContext['focus']
  timeWithChild?: MaternarContext['timeWithChild']
  childAgeBand?: MaternarContext['childAgeBand']

  // perfil (invisível)
  childId?: string
  childAgeMonths?: number | null
  childLabel?: string

  // step (quando aplicável)
  step?: string
}

export type MyDayTaskPayload = {
  title: string
  origin: TaskOrigin
  source: string
  // meta é opcional: se o core do Meu Dia ainda não persistir, não quebra nada.
  meta?: CorrelationMeta
}

function originFromFocus(f: Focus): TaskOrigin {
  if (f === 'filho') return 'family'
  if (f === 'voce') return 'selfcare'
  if (f === 'casa') return 'home'
  if (f === 'comida') return 'today'
  return 'other'
}

function sourceForHub(hub: HubId) {
  if (hub === 'maternar/meu-dia-leve') return MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE
  if (hub === 'maternar/meu-filho') return MY_DAY_SOURCES.MATERNAR_MEU_FILHO
  // Cuidar de Mim (se ainda não existir no enum, manteremos string estável)
  return (MY_DAY_SOURCES as any).MATERNAR_CUIDAR_DE_MIM ?? 'maternar_cuidar_de_mim'
}

/**
 * Constrói uma tarefa padronizada para salvar no Meu Dia.
 * - Sem variações de UI
 * - Sem texto “premium”
 * - Sem inventar tarefas
 */
export function makeMyDayTaskFromHub(input: {
  hub: HubId
  title: string
  step?: string
  focusOverride?: Focus
  childOverride?: ChildSnapshot | null
  contextOverride?: Partial<MaternarContext>
  profileOverride?: ProfileSnapshot
}): MyDayTaskPayload {
  const context = { ...getMaternarContext(), ...(input.contextOverride ?? {}) }
  const profile = input.profileOverride ?? getProfileSnapshot()

  const focus = input.focusOverride ?? context.focus
  const origin = originFromFocus(focus)

  const source = sourceForHub(input.hub)

  const child = input.childOverride ?? null

  const meta: CorrelationMeta = {
    hub: input.hub,
    slot: context.slot,
    mood: context.mood,
    focus: context.focus,
    timeWithChild: context.timeWithChild,
    childAgeBand: context.childAgeBand,
    childId: child?.id,
    childAgeMonths: typeof child?.ageMonths === 'number' ? child.ageMonths : child?.ageMonths ?? null,
    childLabel: child?.label,
    step: input.step,
  }

  return {
    title: input.title,
    origin,
    source,
    meta,
  }
}

/**
 * Jornada (LS) — padrão único para registros.
 * Importante: Jornada só deve marcar "feito", não intenção.
 */
function ymdKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type JourneyKind = 'family' | 'selfcare' | 'home' | 'today' | 'other'

export function markJourneyDone(kind: JourneyKind, meta?: CorrelationMeta) {
  try {
    const dk = ymdKey(new Date())

    // padrão
    window.localStorage.setItem(`journey/${kind}/doneOn`, dk)

    const raw = window.localStorage.getItem(`journey/${kind}/doneCount`)
    const n = raw ? Number(raw) : 0
    const next = Number.isFinite(n) ? n + 1 : 1
    window.localStorage.setItem(`journey/${kind}/doneCount`, String(next))

    if (meta) {
      window.localStorage.setItem(`journey/${kind}/lastMeta`, JSON.stringify(meta))
    }
  } catch {}
}

/**
 * Helper: converte TaskOrigin → JourneyKind
 */
export function journeyKindFromOrigin(origin: TaskOrigin): JourneyKind {
  if (origin === 'family') return 'family'
  if (origin === 'selfcare') return 'selfcare'
  if (origin === 'home') return 'home'
  if (origin === 'today') return 'today'
  return 'other'
}
