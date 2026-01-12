// app/(tabs)/maternar/meu-dia-leve/Client.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'
import { addTaskToMyDay, listMyDayTasks, MY_DAY_SOURCES, type MyDayTaskItem } from '@/app/lib/myDayTasks.client'
import { getProfileSnapshot, getActiveChildOrNull } from '@/app/lib/profile.client'
import { getBrazilDateKey } from '@/app/lib/dateKey'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'inspiracao' | 'ideias' | 'receitas' | 'passo'
type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'
type Focus = 'casa' | 'voce' | 'filho' | 'comida'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

// Regras de liberação (segurança / responsabilidade)
const MIN_MONTHS_BLOCK = 6 // < 6: bloqueia total
const MIN_MONTHS_INTRO_START = 6 // 6 a 11: bloqueia receitas do app
const MIN_MONTHS_ALLOW_RECIPES = 12 // >= 12: libera receitas do app

const LS_PREFIX = 'm360:'

/**
 * Preferências “silenciosas” do hub Meu Dia Leve (P26)
 */
const HUB_PREF = {
  slot: 'maternar/meu-dia-leve/pref/slot',
  mood: 'maternar/meu-dia-leve/pref/mood',
  focus: 'maternar/meu-dia-leve/pref/focus',
  preferredChildId: 'maternar/meu-dia-leve/pref/childId',
}

/**
 * P34.12 — Estrutura inteligente (padrão Meu Filho)
 * Limites diários de geração (por dateKey)
 */
const GEN_LIMITS = {
  paraAgora: 4,
  tresOpcoes: 3,
  recipeAI: 3,
} as const

const GEN_KEYS = {
  paraAgora: (dateKey: string) => `maternar/meu-dia-leve/gen/para-agora/${dateKey}`,
  tresOpcoes: (dateKey: string) => `maternar/meu-dia-leve/gen/tres-opcoes/${dateKey}`,
  recipeAI: (dateKey: string) => `maternar/meu-dia-leve/gen/ai-receita/${dateKey}`,
  lastSelected: (dateKey: string) => `maternar/meu-dia-leve/gen/last-selected/${dateKey}`,
} as const

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const direct = window.localStorage.getItem(key)
    if (direct !== null) return direct
    return window.localStorage.getItem(`${LS_PREFIX}${key}`)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
  } catch {}
}

function safeGetNumber(key: string, fallback = 0): number {
  try {
    const raw = safeGetLS(key)
    if (!raw) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

function bumpDailyCounter(key: string): number {
  const current = safeGetNumber(key, 0)
  const next = current + 1
  safeSetLS(key, String(next))
  return next
}

function canGenerate(key: string, limit: number): { ok: boolean; used: number; limit: number } {
  const used = safeGetNumber(key, 0)
  return { ok: used < limit, used, limit }
}

function stepIndex(s: Step) {
  return s === 'inspiracao' ? 1 : s === 'ideias' ? 2 : s === 'receitas' ? 3 : 4
}

function slotLabel(s: Slot) {
  return s === '3' ? '3 min' : s === '5' ? '5 min' : '10 min'
}

function slotTitle(s: Slot) {
  return s === '3' ? 'micro-alívio' : s === '5' ? 'respiro rápido' : 'virada do dia'
}

/**
 * Ajuste (mobile): subtítulo sempre em frases curtas (2 linhas)
 */
function slotHintLines(s: Slot): { l1: string; l2: string } {
  if (s === '3') {
    return { l1: 'Para quando você está sem tempo.', l2: 'Só para destravar o agora.' }
  }
  if (s === '5') {
    return { l1: 'Cabe entre tarefas.', l2: 'Um ajuste pequeno e útil.' }
  }
  return { l1: 'Para quando você consegue reorganizar.', l2: 'Com um passo simples.' }
}

function moodTitle(m: Mood) {
  if (m === 'no-limite') return 'Ok. Vamos reduzir o peso do agora.'
  if (m === 'corrida') return 'Ok. Vamos escolher o que resolve primeiro.'
  if (m === 'ok') return 'Boa. Vamos manter o dia fluindo.'
  return 'Perfeito. Vamos aproveitar para deixar mais leve.'
}

function focusTitle(f: Focus) {
  if (f === 'casa') return 'Casa'
  if (f === 'voce') return 'Você'
  if (f === 'filho') return 'Filho'
  return 'Comida'
}

function normalizeSlot(v: unknown): Slot | null {
  const s = String(v ?? '').trim()
  if (s === '3' || s === '5' || s === '10') return s
  return null
}

function normalizeMood(v: unknown): Mood | null {
  const s = String(v ?? '').trim()
  if (s === 'no-limite' || s === 'corrida' || s === 'ok' || s === 'leve') return s
  return null
}

function normalizeFocus(v: unknown): Focus | null {
  const s = String(v ?? '').trim()
  if (s === 'casa' || s === 'voce' || s === 'filho' || s === 'comida') return s
  return null
}

/**
 * Inferência “best effort” (P26)
 */
function inferContext(): { slot: Slot; mood: Mood; focus: Focus } {
  const prefSlot = normalizeSlot(safeGetLS(HUB_PREF.slot))
  const prefMood = normalizeMood(safeGetLS(HUB_PREF.mood))
  const prefFocus = normalizeFocus(safeGetLS(HUB_PREF.focus))

  const legacySlot = normalizeSlot(safeGetLS('eu360_day_slot'))
  const legacyMood = normalizeMood(safeGetLS('eu360_mood'))
  const legacyFocus = normalizeFocus(safeGetLS('eu360_focus_today'))

  const mood: Mood = prefMood ?? legacyMood ?? 'corrida'
  const focus: Focus = prefFocus ?? legacyFocus ?? 'filho'

  // regra antiga preservada: no-limite força 3 min
  if (mood === 'no-limite') return { slot: '3', mood, focus }

  const slot: Slot = prefSlot ?? legacySlot ?? '5'
  return { slot, mood, focus }
}

type QuickIdea = { tag: string; title: string; how: string; slot: Slot; focus: Focus }
type QuickRecipe = { tag: string; title: string; how: string; slot: Slot }
type DayLine = { title: string; why: string; focus: Focus; slot: Slot }

const INSPIRATIONS: Record<Mood, { title: string; line1: string; line2: string; action: string }> = {
  'no-limite': {
    title: 'Para agora',
    line1: 'Escolha uma coisa só.',
    line2: 'O resto pode esperar.',
    action: 'Defina 1 prioridade mínima.',
  },
  corrida: {
    title: 'Para hoje',
    line1: 'O dia melhora quando você decide o próximo passo.',
    line2: 'Não o dia inteiro.',
    action: 'Escolha o próximo passo.',
  },
  ok: {
    title: 'Para manter',
    line1: 'Quando você simplifica, você ganha tempo de verdade.',
    line2: 'Só o que importa agora.',
    action: 'Corte uma exigência.',
  },
  leve: {
    title: 'Para aproveitar',
    line1: 'Dia leve não é dia perfeito.',
    line2: 'É dia bem conduzido.',
    action: 'Faça o básico bem feito.',
  },
}

const IDEIAS: QuickIdea[] = [
  { tag: '3 min', title: 'Respirar + ombros para baixo', how: '3 respirações lentas. Ombros para baixo 3 vezes.', slot: '3', focus: 'voce' },
  { tag: '3 min', title: 'Mensagem curta que resolve', how: 'Uma mensagem objetiva. Sem texto longo.', slot: '3', focus: 'casa' },
  { tag: '5 min', title: 'Conexão com o filho (sem inventar)', how: 'Pergunta simples: “o que foi legal hoje?”. Ouvir 20 segundos.', slot: '5', focus: 'filho' },
  { tag: '5 min', title: 'Organizar um ponto só', how: 'Uma bancada ou mesa. Não a casa toda.', slot: '5', focus: 'casa' },
  { tag: '10 min', title: 'Música + tarefa que já existe', how: 'Uma música. Uma tarefa que você já faria.', slot: '10', focus: 'voce' },
  { tag: '10 min', title: 'Banho/escova em modo leve', how: 'Transforme a rotina em “missão” rápida. Sem discussão.', slot: '10', focus: 'filho' },
  { tag: '5 min', title: 'Água + lanche simples', how: 'Água. Algo pronto. Resolve energia sem complicar.', slot: '5', focus: 'comida' },
]

const RECEITAS: QuickRecipe[] = [
  { tag: '3 min', title: 'Iogurte com fruta (montagem simples)', how: 'Monte com o que tiver. Sem medida.', slot: '3' },
  { tag: '5 min', title: 'Ovo mexido macio', how: 'Fogo baixo. Pronto.', slot: '5' },
  { tag: '5 min', title: 'Refeição simples com o que tem', how: 'Uma base. Um complemento. Do jeito mais fácil agora.', slot: '5' },
  { tag: '10 min', title: 'Comida do dia sem complicar', how: 'Esquentar e servir. Só até ficar bom para comer.', slot: '10' },
]

const PASSO_LEVE: DayLine[] = [
  { title: 'Resolver 1 coisa que está travando', why: 'Quando algo destrava, o resto fica mais fácil.', focus: 'casa', slot: '5' },
  { title: 'Fazer 5 min de conexão com o filho', why: 'Curto e intencional funciona melhor.', focus: 'filho', slot: '5' },
  { title: 'Proteger 10 min só seus', why: 'Sem tela. Sem tarefa. Só recarregar.', focus: 'voce', slot: '10' },
  { title: 'Simplificar a refeição', why: 'Comida simples também é cuidado. E libera energia.', focus: 'comida', slot: '5' },
]

function Pill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-[12px] border transition',
        active ? 'bg-white/90 border-white/60 text-[#2f3a56]' : 'bg-white/20 border border-white/35 text-white/90 hover:bg-white/30',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function CardChoice({
  title,
  subtitle,
  tag,
  active,
  onClick,
}: {
  title: string
  subtitle: string
  tag: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-3xl border p-4 transition',
        active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
      ].join(' ')}
    >
      <div className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
        {tag}
      </div>
      <div className="mt-2 text-[13px] font-semibold text-[#2f3a56] leading-snug">{title}</div>
      <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{subtitle}</div>
    </button>
  )
}

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0
  if (i < 0) return 0
  if (i >= len) return len - 1
  return i
}

function originFromFocus(f: Focus): TaskOrigin {
  if (f === 'filho') return 'family'
  if (f === 'voce') return 'selfcare'
  if (f === 'casa') return 'home'
  if (f === 'comida') return 'today'
  return 'other'
}

/**
 * Inspiração: título "de tarefa" (curto, específico, sem cara de UI)
 */
function toMyDayTitleFromInspiration(input: { mood: Mood; slot: Slot; focus: Focus }): string {
  const { slot, focus } = input

  if (focus === 'filho') return slot === '3' ? 'Conexão rápida (3 min)' : 'Conexão com o filho (5 min)'
  if (focus === 'voce')
    return slot === '3' ? 'Pausa curta (3 min)' : slot === '5' ? 'Respiro rápido (5 min)' : '10 min só meus'
  if (focus === 'casa') return slot === '3' ? 'Destravar 1 ponto da casa' : 'Organizar 1 ponto só'
  return 'Simplificar a refeição'
}

type AIRecipeResponse = { ok: boolean; text?: string; error?: string; hint?: string }

async function requestAIRecipe(input: {
  slot: Slot
  mood: Mood
  pantry: string
  childAgeMonths: number
  childAgeYears?: number
  childAgeLabel?: string
}): Promise<AIRecipeResponse> {
  const res = await fetch('/api/ai/meu-dia-leve/receita', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slot: input.slot,
      mood: input.mood,
      pantry: input.pantry,
      childAgeMonths: input.childAgeMonths,
      childAgeYears: input.childAgeYears,
      childAgeLabel: input.childAgeLabel,
    }),
  })

  if (!res.ok) {
    return { ok: false, error: `http_${res.status}`, hint: 'Não deu certo agora. Se quiser, use uma opção pronta abaixo.' }
  }

  return (await res.json()) as AIRecipeResponse
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many
}

function formatChildLabelExact(input: { label: string; ageMonths: number | null }) {
  if (input.ageMonths === null) return `${input.label} • idade não preenchida`
  const m = input.ageMonths
  if (m < 24) return `${input.label} • ${m} ${plural(m, 'mês', 'meses')}`
  const years = Math.floor(m / 12)
  return `${input.label} • ${m} meses (${years} ${plural(years, 'ano', 'anos')})`
}

function childAgeTier(months: number) {
  if (months < 6) return 'under_6' as const
  if (months < 12) return 'intro_6_11' as const
  if (months < 24) return 'toddler_12_23' as const
  return 'kid_24_plus' as const
}

/* =========================
   P26 — Guardrails (local)
========================= */

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  const s = (t as any).status
  if (s === 'active' || s === 'snoozed' || s === 'done') return s
  if ((t as any).done === true) return 'done'
  return 'active'
}

function countActiveFromMeuDiaLeveToday(tasks: MyDayTaskItem[]) {
  return tasks.filter((t) => {
    const isFromMeuDiaLeve = (t as any).source === MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE
    const isActive = statusOf(t) === 'active'
    return isFromMeuDiaLeve && isActive
  }).length
}

/* =========================
   P34.12 — Plano pronto (estrutura Meu Filho)
========================= */

type PlanKind = 'idea' | 'passo' | 'recipe' | 'inspiration'
type PlanItem = { kind: PlanKind; tag: string; title: string; how: string; slot: Slot; focus: Focus }

function buildPlanPool(input: { slot: Slot; focus: Focus }): PlanItem[] {
  const { slot, focus } = input

  const ideas = IDEIAS.filter((i) => i.slot === slot && i.focus === focus).map((i) => ({
    kind: 'idea' as const,
    tag: i.tag,
    title: i.title,
    how: i.how,
    slot: i.slot,
    focus: i.focus,
  }))

  const passos = PASSO_LEVE.filter((p) => p.focus === focus).map((p) => ({
    kind: 'passo' as const,
    tag: `${p.slot} min`,
    title: p.title,
    how: p.why,
    slot: p.slot,
    focus: p.focus,
  }))

  const recipes =
    focus === 'comida'
      ? (RECEITAS.filter((r) => r.slot === slot).length ? RECEITAS.filter((r) => r.slot === slot) : RECEITAS).map((r) => ({
          kind: 'recipe' as const,
          tag: r.tag,
          title: r.title,
          how: r.how,
          slot: r.slot,
          focus: 'comida' as const,
        }))
      : []

  const ideasBySlot =
    ideas.length >= 2
      ? []
      : IDEIAS.filter((i) => i.slot === slot)
          .slice(0, 4)
          .map((i) => ({
            kind: 'idea' as const,
            tag: i.tag,
            title: i.title,
            how: i.how,
            slot: i.slot,
            focus: i.focus,
          }))

  const merged = [...ideas, ...ideasBySlot, ...passos, ...recipes]

  const seen = new Set<string>()
  const out: PlanItem[] = []
  for (const it of merged) {
    const k = `${it.kind}:${it.title}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

function pickWithRotation<T>(arr: T[], offset: number): T[] {
  if (!arr.length) return []
  const start = Math.abs(offset) % arr.length
  return [...arr.slice(start), ...arr.slice(0, start)]
}

export default function MeuDiaLeveClient() {
  const [step, setStep] = useState<Step>('inspiracao')
  const [slot, setSlot] = useState<Slot>('5')
  const [mood, setMood] = useState<Mood>('corrida')
  const [focus, setFocus] = useState<Focus>('filho')

  const [pickedIdea, setPickedIdea] = useState<number>(0)
  const [pickedRecipe, setPickedRecipe] = useState<number>(0)
  const [pickedPasso, setPickedPasso] = useState<number>(0)

  const [saveFeedback, setSaveFeedback] = useState<string>('')

  const [children, setChildren] = useState<Array<{ id: string; label: string; ageMonths: number | null }>>([])
  const [activeChildId, setActiveChildId] = useState<string>('')

  const [pantry, setPantry] = useState<string>('')
  const [aiRecipeText, setAiRecipeText] = useState<string>('')
  const [aiRecipeLoading, setAiRecipeLoading] = useState<boolean>(false)
  const [aiRecipeError, setAiRecipeError] = useState<string>('')
  const [aiRecipeHint, setAiRecipeHint] = useState<string>('')

  const [planParaAgora, setPlanParaAgora] = useState<PlanItem | null>(null)
  const [planOptions, setPlanOptions] = useState<PlanItem[]>([])
  const [planPicked, setPlanPicked] = useState<number>(0)
  const [planNote, setPlanNote] = useState<string>('')

  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'meu-dia-leve', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferContext()
    setSlot(inferred.slot)
    setMood(inferred.mood)
    setFocus(inferred.focus)
    setStep('inspiracao')

    const snap = getProfileSnapshot()
    setChildren(snap.children)

    const prefChildId = safeGetLS(HUB_PREF.preferredChildId)
    const active = getActiveChildOrNull(prefChildId)
    setActiveChildId(active?.id ?? '')

    try {
      track('meu_dia_leve.open', {
        slot: inferred.slot,
        mood: inferred.mood,
        focus: inferred.focus,
        profileSource: snap.source,
        kidsCount: snap.children.length,
        kidsWithAge: snap.children.filter((k) => typeof k.ageMonths === 'number').length,
      })
    } catch {}
  }, [])

  useEffect(() => {
    if (!children.length) return
    if (activeChildId) return

    const prefChildId = safeGetLS(HUB_PREF.preferredChildId)
    const best = getActiveChildOrNull(prefChildId)
    if (best?.id) setActiveChildId(best.id)
  }, [children.length, activeChildId])

  const inspiration = useMemo(() => INSPIRATIONS[mood], [mood])

  const ideasForNow = useMemo(() => {
    const strict = IDEIAS.filter((i) => i.slot === slot && i.focus === focus)
    if (strict.length >= 2) return strict.slice(0, 3)
    const bySlot = IDEIAS.filter((i) => i.slot === slot)
    if (bySlot.length >= 3) return bySlot.slice(0, 4)
    return IDEIAS.slice(0, 4)
  }, [slot, focus])

  const recipesForNow = useMemo(() => {
    const bySlot = RECEITAS.filter((r) => r.slot === slot)
    return (bySlot.length ? bySlot : RECEITAS).slice(0, 3)
  }, [slot])

  const passosForNow = useMemo(() => {
    const strict = PASSO_LEVE.filter((p) => p.focus === focus)
    return (strict.length ? strict : PASSO_LEVE).slice(0, 3)
  }, [focus])

  function flash(msg: string, ms = 2200) {
    setSaveFeedback(msg)
    window.setTimeout(() => setSaveFeedback(''), ms)
  }

  function go(next: Step) {
    setStep(next)
    if (next === 'receitas') {
      setAiRecipeError('')
      setAiRecipeText('')
      setAiRecipeHint('')
    }
    try {
      track('meu_dia_leve.step', { step: next })
    } catch {}
  }

  function onSelectSlot(next: Slot) {
    setSlot(next)
    safeSetLS(HUB_PREF.slot, next)
    safeSetLS('eu360_day_slot', next)

    setPickedIdea(0)
    setPickedRecipe(0)
    setPickedPasso(0)

    setPlanParaAgora(null)
    setPlanOptions([])
    setPlanPicked(0)
    setPlanNote('')

    try {
      track('meu_dia_leve.slot.select', { slot: next })
    } catch {}
  }

  function onSelectMood(next: Mood) {
    setMood(next)
    safeSetLS(HUB_PREF.mood, next)
    safeSetLS('eu360_mood', next)

    if (next === 'no-limite') {
      setSlot('3')
      safeSetLS(HUB_PREF.slot, '3')
      safeSetLS('eu360_day_slot', '3')
    }

    setPlanParaAgora(null)
    setPlanOptions([])
    setPlanPicked(0)
    setPlanNote('')

    try {
      track('meu_dia_leve.mood.select', { mood: next })
    } catch {}
  }

  function onSelectFocus(next: Focus) {
    setFocus(next)
    safeSetLS(HUB_PREF.focus, next)
    safeSetLS('eu360_focus_today', next)

    setPickedIdea(0)
    setPickedRecipe(0)
    setPickedPasso(0)

    setPlanParaAgora(null)
    setPlanOptions([])
    setPlanPicked(0)
    setPlanNote('')

    try {
      track('meu_dia_leve.focus.select', { focus: next })
    } catch {}
  }

  const selectedIdea = ideasForNow[clampIndex(pickedIdea, ideasForNow.length)]
  const selectedRecipe = recipesForNow[clampIndex(pickedRecipe, recipesForNow.length)]
  const selectedPasso = passosForNow[clampIndex(pickedPasso, passosForNow.length)]

  function saveCurrentToMyDay(title: string) {
    const ORIGIN = originFromFocus(focus)
    const SOURCE = MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE

    const today = listMyDayTasks()
    const activeCount = countActiveFromMeuDiaLeveToday(today)
    if (activeCount >= 3) {
      flash('Você já salvou 3 ações do Meu Dia Leve hoje. Conclua uma. Ou escolha só 1 para agora.', 3200)
      try {
        track('my_day.task.add.blocked', { source: SOURCE, origin: ORIGIN, reason: 'limit_reached', limit: 3 })
      } catch {}
      return
    }

    const res = addTaskToMyDay({ title, origin: ORIGIN, source: SOURCE })

    if (res.limitHit) {
      flash('Seu Meu Dia já está cheio hoje. Conclua ou adie algo antes de salvar mais.', 3200)
      try {
        track('my_day.task.add.blocked', { source: SOURCE, origin: ORIGIN, reason: 'open_tasks_limit_hit', dateKey: res.dateKey })
      } catch {}
      return
    }

    markRecentMyDaySave({ origin: ORIGIN, source: SOURCE })

    if (res.created) flash('Salvo no Meu Dia.')
    else flash('Essa tarefa já estava no Meu Dia.')

    try {
      track('my_day.task.add', { ok: !!res.ok, created: !!res.created, origin: ORIGIN, source: SOURCE, dateKey: res.dateKey })
      track('meu_dia_leve.save_to_my_day', { origin: ORIGIN, created: res.created, dateKey: res.dateKey, source: SOURCE })
    } catch {}
  }

  const activeChild = useMemo(() => {
    if (!children.length) return null
    const found = children.find((c) => c.id === activeChildId)
    return found ?? children[0]
  }, [children, activeChildId])

  const activeMonths = activeChild?.ageMonths ?? null
  const activeYears = useMemo(() => {
    if (activeMonths === null) return null
    if (!Number.isFinite(activeMonths)) return null
    return Math.floor(activeMonths / 12)
  }, [activeMonths])

  const activeAgeLabel = useMemo(() => {
    if (!activeChild) return null
    if (activeChild.ageMonths === null) return null
    return formatChildLabelExact({ label: activeChild.label, ageMonths: activeChild.ageMonths })
  }, [activeChild])

  const ageTier = useMemo(() => {
    if (activeMonths === null) return null
    return childAgeTier(activeMonths)
  }, [activeMonths])

  const gate = useMemo(() => {
    if (!children.length) {
      return { blocked: true, reason: 'no_children' as const, title: 'Observação', message: 'Para sugerir com segurança, complete o cadastro do(s) filho(s) no Eu360.' }
    }

    if (!activeChild) {
      return { blocked: true, reason: 'no_active' as const, title: 'Para sugerir com segurança', message: 'Selecione um filho com idade preenchida no Eu360.' }
    }

    if (activeMonths === null) {
      return { blocked: true, reason: 'age_missing' as const, title: 'Para sugerir com segurança', message: 'Complete a idade do(s) filho(s) no Eu360.' }
    }

    if (activeMonths < MIN_MONTHS_BLOCK) {
      return {
        blocked: true,
        reason: 'under_6' as const,
        title: 'Sem receitas por enquanto',
        message: 'Para essa fase, aqui a gente não sugere receitas. Siga a orientação que você já usa com sua rede de saúde.',
      }
    }

    if (activeMonths >= MIN_MONTHS_INTRO_START && activeMonths < MIN_MONTHS_ALLOW_RECIPES) {
      return {
        blocked: true,
        reason: 'intro_6_11' as const,
        title: 'Introdução alimentar',
        message:
          'Entre 6 e 11 meses, as orientações variam. Aqui, por enquanto, a gente não sugere receitas. Siga a orientação que você já usa com sua rede de saúde.',
      }
    }

    return { blocked: false, reason: 'ok' as const, title: '', message: '' }
  }, [children.length, activeChild, activeMonths])

  async function onGenerateAIRecipe() {
    setAiRecipeError('')
    setAiRecipeText('')
    setAiRecipeHint('')

    const counterKey = GEN_KEYS.recipeAI(todayKey)
    const allowed = canGenerate(counterKey, GEN_LIMITS.recipeAI)
    if (!allowed.ok) {
      setAiRecipeHint(`Hoje já geramos ${allowed.used}/${allowed.limit} receitas. Amanhã libera de novo.`)
      try {
        track('meu_dia_leve.recipe.blocked', { reason: 'daily_limit', used: allowed.used, limit: allowed.limit })
      } catch {}
      return
    }

    if (gate.blocked) {
      try {
        track('meu_dia_leve.recipe.blocked', { reason: gate.reason, activeMonths })
      } catch {}
      setAiRecipeHint(gate.message || 'Complete a idade no Eu360 para liberar.')
      return
    }

    const trimmed = pantry.trim()
    if (!trimmed) {
      setAiRecipeHint('Escreva curto o que você tem em casa.')
      return
    }

    bumpDailyCounter(counterKey)

    setAiRecipeLoading(true)
    try {
      const data = await requestAIRecipe({
        slot,
        mood,
        pantry: trimmed,
        childAgeMonths: activeMonths as number,
        childAgeYears: typeof activeYears === 'number' ? activeYears : undefined,
        childAgeLabel: activeAgeLabel ?? undefined,
      })

      if (!data?.ok || !data.text) {
        setAiRecipeError(data?.error || 'erro_receita')
        setAiRecipeHint(data?.hint || 'Se quiser, escreva mais 1 item. Ou use uma opção pronta abaixo.')
        return
      }

      setAiRecipeText(data.text)
      setAiRecipeHint('')
    } catch {
      setAiRecipeError('erro_rede')
      setAiRecipeHint('Não consegui gerar agora. Se quiser, use uma opção pronta abaixo.')
    } finally {
      setAiRecipeLoading(false)
    }
  }

  const helperCopy = useMemo(() => {
    if (gate.blocked) return ''
    if (aiRecipeHint) return aiRecipeHint

    if (ageTier === 'toddler_12_23') return 'Pode ser só 1 item. Se der, diga se é lanche ou refeição.'
    if (ageTier === 'kid_24_plus') return 'Pode ser só 1 item. Se quiser, diga o tipo (lanche/almoço/janta).'

    return 'Pode ser só 1 item. Se ficar vago, eu te peço mais 1. Sem complicar.'
  }, [gate.blocked, aiRecipeHint, ageTier])

  const stepTitle = useMemo(() => {
    if (step === 'inspiracao') return 'Inspiração do dia'
    if (step === 'ideias') return 'Ideias rápidas'
    if (step === 'receitas') return 'Receitas rápidas'
    return 'Passo leve'
  }, [step])

  const stepSubtitleLines = useMemo((): { l1: string; l2: string } => {
    if (step === 'inspiracao') return { l1: 'Uma frase curta.', l2: 'Só para organizar o agora.' }
    if (step === 'ideias') return { l1: 'Escolha uma ideia pequena.', l2: 'E possível de fazer agora.' }
    if (step === 'receitas') return { l1: 'Uma receita simples.', l2: 'Sem complicar.' }
    return { l1: 'Um passo único.', l2: 'Para fechar o agora.' }
  }, [step])

  const headerCopyLines = useMemo((): { l1: string; l2: string; l3?: string } => {
    return { l1: 'Você entra sem clareza.', l2: 'Sai com um próximo passo simples para agora.', l3: 'Sem ficar caçando.' }
  }, [])

  const slotHint = useMemo(() => slotHintLines(slot), [slot])

  function onGeneratePlanParaAgora() {
    setPlanNote('')

    const counterKey = GEN_KEYS.paraAgora(todayKey)
    const allowed = canGenerate(counterKey, GEN_LIMITS.paraAgora)
    if (!allowed.ok) {
      setPlanNote(`Hoje já geramos ${allowed.used}/${allowed.limit} sugestões “Para agora”. Amanhã libera de novo.`)
      try {
        track('meu_dia_leve.plan.blocked', { kind: 'para_agora', used: allowed.used, limit: allowed.limit })
      } catch {}
      return
    }

    const count = bumpDailyCounter(counterKey)
    const pool = buildPlanPool({ slot, focus })

    if (!pool.length) {
      const title = toMyDayTitleFromInspiration({ mood, slot, focus })
      const item: PlanItem = { kind: 'inspiration', tag: slotLabel(slot), title, how: moodTitle(mood), slot, focus }
      setPlanParaAgora(item)
      try {
        track('meu_dia_leve.plan.generate', { kind: 'para_agora', source: 'fallback', slot, mood, focus, count })
      } catch {}
      return
    }

    const rotated = pickWithRotation(pool, count)
    setPlanParaAgora(rotated[0])
    try {
      track('meu_dia_leve.plan.generate', { kind: 'para_agora', source: 'local', slot, mood, focus, count })
    } catch {}
  }

  function onGeneratePlanTresOpcoes() {
    setPlanNote('')

    const counterKey = GEN_KEYS.tresOpcoes(todayKey)
    const allowed = canGenerate(counterKey, GEN_LIMITS.tresOpcoes)
    if (!allowed.ok) {
      setPlanNote(`Hoje já geramos ${allowed.used}/${allowed.limit} conjuntos de “3 opções”. Amanhã libera de novo.`)
      try {
        track('meu_dia_leve.plan.blocked', { kind: 'tres_opcoes', used: allowed.used, limit: allowed.limit })
      } catch {}
      return
    }

    const count = bumpDailyCounter(counterKey)
    const pool = buildPlanPool({ slot, focus })

    if (!pool.length) {
      setPlanOptions([])
      setPlanPicked(0)
      setPlanNote('Não consegui montar opções agora. Tente trocar o foco ou o tempo.')
      try {
        track('meu_dia_leve.plan.generate', { kind: 'tres_opcoes', source: 'empty_pool', slot, mood, focus, count })
      } catch {}
      return
    }

    const rotated = pickWithRotation(pool, count)
    const options = rotated.slice(0, 3)
    setPlanOptions(options)
    setPlanPicked(0)

    try {
      track('meu_dia_leve.plan.generate', { kind: 'tres_opcoes', source: 'local', slot, mood, focus, count })
    } catch {}
  }

  const selectedPlan = useMemo(() => {
    if (!planOptions.length) return null
    return planOptions[clampIndex(planPicked, planOptions.length)]
  }, [planOptions, planPicked])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
        <header className="pt-6 md:pt-10 mb-5 md:mb-8">
          <div className="space-y-3">
            <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1">
              <span className="mr-1.5 text-lg leading-none">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              Meu Dia Leve
            </h1>

            <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              <span className="block md:inline">{headerCopyLines.l1}{' '}</span>
              <span className="block md:inline">{headerCopyLines.l2}{' '}</span>
              {headerCopyLines.l3 ? <span className="block md:inline">{headerCopyLines.l3}</span> : null}
            </p>
          </div>
        </header>

        <section
          className="
            rounded-3xl
            bg-white/10
            border border-white/35
            backdrop-blur-xl
            shadow-[0_18px_45px_rgba(184,35,107,0.25)]
            overflow-hidden
          "
        >
          <div className="p-4 md:p-6 border-b border-white/25">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                  <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
                </div>

                <div>
                  <div className="text-[12px] text-white/85">
                    <div>Passo {stepIndex(step)}/4 • {slotLabel(slot)}</div>
                    <div>{slotTitle(slot)} • foco {focusTitle(focus)}</div>
                  </div>

                  <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                    Sugestão pronta para o seu agora
                  </div>

                  <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                    {slotHint.l1}
                    <br />
                    {slotHint.l2}
                  </div>
                </div>
              </div>

              <button
                onClick={() => go('ideias')}
                className="rounded-full bg-white/90 hover:bg-white text-[#2f3a56] px-4 py-2 text-[12px] shadow-lg transition"
              >
                Começar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                <div className="text-[12px] text-white/85 mb-2">Quanto tempo dá?</div>
                <div className="flex flex-wrap gap-2">
                  {(['3', '5', '10'] as Slot[]).map((s) => (
                    <Pill key={s} active={slot === s} onClick={() => onSelectSlot(s)}>
                      {slotLabel(s)}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                <div className="text-[12px] text-white/85 mb-2">Como está o dia?</div>
                <div className="flex flex-wrap gap-2">
                  {(['no-limite', 'corrida', 'ok', 'leve'] as Mood[]).map((m) => (
                    <Pill key={m} active={mood === m} onClick={() => onSelectMood(m)}>
                      {m === 'no-limite' ? 'no limite' : m}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                <div className="text-[12px] text-white/85 mb-2">Foco de agora</div>
                <div className="flex flex-wrap gap-2">
                  {(['filho', 'casa', 'comida', 'voce'] as Focus[]).map((f) => (
                    <Pill key={f} active={focus === f} onClick={() => onSelectFocus(f)}>
                      {focusTitle(f)}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  { id: 'inspiracao' as const, label: 'Inspiração do dia' },
                  { id: 'ideias' as const, label: 'Ideias rápidas' },
                  { id: 'receitas' as const, label: 'Receitas rápidas' },
                  { id: 'passo' as const, label: 'Passo leve' },
                ] as const
              ).map((it) => {
                const active = step === it.id
                return (
                  <button
                    key={it.id}
                    onClick={() => go(it.id)}
                    className={[
                      'rounded-full px-3 py-1.5 text-[12px] border transition',
                      active ? 'bg-white/90 border-white/60 text-[#2f3a56]' : 'bg-white/20 border border-white/35 text-white/90 hover:bg-white/30',
                    ].join(' ')}
                  >
                    {it.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 md:p-6">
            <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
              {/* =========================
                  P34.12 — PLANO PRONTO (Meu Filho)
              ========================== */}
              <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                      plano pronto para agora
                    </div>
                    <div className="mt-1 text-[16px] font-semibold text-[#2f3a56]">
                      Você escolhe o cenário — eu te entrego opções boas.
                    </div>
                    <div className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed">
                      Sem ficar caçando. Sem catálogo infinito.
                      <br />
                      Se não servir, gere de novo (com limite diário).
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onGeneratePlanParaAgora}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Gerar plano para agora
                      </button>

                      <button
                        type="button"
                        onClick={onGeneratePlanTresOpcoes}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Gerar 3 opções
                      </button>

                      {planNote ? <span className="text-[12px] text-[#6a6a6a]">{planNote}</span> : null}
                    </div>

                    {/* Para agora */}
                    <div className="mt-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        para agora
                      </div>

                      {planParaAgora ? (
                        <div className="mt-2 rounded-3xl border border-[#f5d7e5] bg-white p-5">
                          <div className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
                            {planParaAgora.tag}
                          </div>
                          <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{planParaAgora.title}</div>
                          <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{planParaAgora.how}</div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveCurrentToMyDay(planParaAgora.title)}
                              className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                            >
                              Salvar no Meu Dia
                            </button>

                            {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-[13px] text-[#6a6a6a]">
                          Clique em “Gerar plano para agora” para receber uma sugestão curta e pronta.
                        </div>
                      )}
                    </div>

                    {/* 3 opções */}
                    <div className="mt-6">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        3 opções (com base nos filtros)
                      </div>

                      {planOptions.length ? (
                        <div className="mt-3 space-y-2">
                          {planOptions.map((o, idx) => (
                            <button
                              key={`${o.kind}-${o.title}-${idx}`}
                              type="button"
                              onClick={() => {
                                setPlanPicked(idx)
                                try {
                                  safeSetLS(GEN_KEYS.lastSelected(todayKey), String(idx))
                                  track('meu_dia_leve.plan.pick', { idx, kind: o.kind, slot, mood, focus })
                                } catch {}
                              }}
                              className={[
                                'w-full text-left rounded-2xl border p-4 transition',
                                planPicked === idx ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-[#2f3a56]">{o.title}</div>
                                  <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">{o.how}</div>
                                </div>
                                <span className="shrink-0 inline-flex items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
                                  {o.tag}
                                </span>
                              </div>
                            </button>
                          ))}

                          {selectedPlan ? (
                            <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-white p-5">
                              <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                                opção selecionada
                              </div>

                              <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{selectedPlan.title}</div>
                              <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedPlan.how}</div>

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveCurrentToMyDay(selectedPlan.title)}
                                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                                >
                                  Salvar no Meu Dia
                                </button>

                                <button
                                  type="button"
                                  onClick={onGeneratePlanTresOpcoes}
                                  className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                                >
                                  Gerar novas 3 opções
                                </button>

                                {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                              </div>

                              <div className="mt-3 text-[11px] text-[#6a6a6a]">Fonte: opções locais (fallback).</div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-2 text-[13px] text-[#6a6a6a]">
                          Clique em “Gerar 3 opções” para receber três opções curtas.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#f5d7e5]" />

              {/* Conteúdo original (passos 1–4) */}
              <div className="mt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name={step === 'receitas' ? 'heart' : 'sparkles'} size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                      {stepTitle}
                    </span>

                    <h2 className="text-lg font-semibold text-[#2f3a56]">
                      {step === 'inspiracao'
                        ? 'Uma frase simples para agora'
                        : step === 'ideias'
                        ? 'Uma ideia pequena e possível'
                        : step === 'receitas'
                        ? 'Uma receita simples para agora'
                        : 'Um passo leve para fechar o agora'}
                    </h2>

                    <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                      {stepSubtitleLines.l1}
                      <br />
                      {stepSubtitleLines.l2}
                    </p>
                  </div>
                </div>

                {/* INSPIRAÇÃO */}
                {step === 'inspiracao' ? (
                  <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                    <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">{inspiration.title}</div>

                    <div className="mt-2 text-[15px] font-semibold text-[#2f3a56] leading-snug">
                      {inspiration.line1}
                      <br />
                      {inspiration.line2}
                    </div>

                    <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{moodTitle(mood)}</div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveCurrentToMyDay(toMyDayTitleFromInspiration({ mood, slot, focus }))}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Salvar no Meu Dia
                      </button>

                      <button
                        type="button"
                        onClick={() => go('ideias')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Ir para Ideias rápidas
                      </button>

                      {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                    </div>
                  </div>
                ) : null}

                {/* IDEIAS */}
                {step === 'ideias' ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-3xl border border-[#f5d7e5] bg-white p-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">escolha 1 ideia</div>
                      <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                        Pequeno e possível.
                        <br />
                        Só para destravar o agora.
                      </div>

                      <div className="mt-4 space-y-2">
                        {ideasForNow.map((i, idx) => (
                          <CardChoice
                            key={`${i.title}-${idx}`}
                            title={i.title}
                            subtitle={i.how}
                            tag={i.tag}
                            active={pickedIdea === idx}
                            onClick={() => setPickedIdea(idx)}
                          />
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveCurrentToMyDay(selectedIdea?.title || 'Ideia rápida')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Salvar no Meu Dia
                        </button>

                        <button
                          type="button"
                          onClick={() => go('receitas')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ir para Receitas rápidas
                        </button>

                        {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* RECEITAS */}
                {step === 'receitas' ? (
                  <div className="mt-4 space-y-4">
                    {children.length ? (
                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">para qual filho?</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Para sugerir com segurança,
                          <br />
                          o Materna usa a idade do Eu360.
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {children.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setActiveChildId(c.id)
                                safeSetLS(HUB_PREF.preferredChildId, c.id)

                                setAiRecipeText('')
                                setAiRecipeError('')
                                setAiRecipeHint('')
                                try {
                                  track('meu_dia_leve.child.select', { childId: c.id, ageMonths: c.ageMonths })
                                } catch {}
                              }}
                              className={[
                                'rounded-full px-3 py-1.5 text-[12px] border transition',
                                activeChild?.id === c.id
                                  ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                                  : 'bg-white border-[#f5d7e5] text-[#2f3a56] hover:bg-[#ffe1f1]',
                              ].join(' ')}
                            >
                              {formatChildLabelExact({ label: c.label, ageMonths: c.ageMonths })}
                            </button>
                          ))}
                        </div>

                        <div className="mt-3">
                          <Link
                            href="/eu360"
                            className="inline-flex rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Atualizar no Eu360
                          </Link>
                        </div>
                      </div>
                    ) : null}

                    {gate.blocked ? (
                      <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">{gate.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{gate.message}</div>
                        <div className="mt-3">
                          <Link
                            href="/eu360"
                            className="inline-flex rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir para Eu360
                          </Link>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-3xl border border-[#f5d7e5] bg-white p-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">o que você tem em casa</div>

                      {!gate.blocked && helperCopy ? (
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{helperCopy}</div>
                      ) : null}

                      <textarea
                        value={pantry}
                        onChange={(e) => {
                          setPantry(e.target.value)
                          if (aiRecipeHint) setAiRecipeHint('')
                        }}
                        rows={3}
                        placeholder="o que tenho em casa…"
                        disabled={gate.blocked}
                        className={[
                          'mt-3 w-full rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-4 py-3 text-[13px] text-[#2f3a56] outline-none focus:ring-2 focus:ring-[#ffd8e6]',
                          gate.blocked ? 'opacity-70 cursor-not-allowed' : '',
                        ].join(' ')}
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={onGenerateAIRecipe}
                          disabled={aiRecipeLoading || gate.blocked}
                          className={[
                            'rounded-full px-4 py-2 text-[12px] shadow-lg transition',
                            aiRecipeLoading || gate.blocked ? 'bg-[#fd2597]/50 text-white cursor-not-allowed' : 'bg-[#fd2597] text-white hover:opacity-95',
                          ].join(' ')}
                        >
                          {aiRecipeLoading ? 'Gerando…' : 'Gerar receita'}
                        </button>

                        {aiRecipeHint ? <span className="text-[12px] text-[#6a6a6a]">{aiRecipeHint}</span> : null}
                      </div>

                      {aiRecipeText ? (
                        <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">receita pronta</div>
                          <div className="mt-2 text-[13px] text-[#2f3a56] leading-relaxed whitespace-pre-wrap">{aiRecipeText}</div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveCurrentToMyDay('Receita rápida')}
                              className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                            >
                              Salvar no Meu Dia
                            </button>
                            {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      {recipesForNow.map((r, idx) => {
                        const active = pickedRecipe === idx
                        return (
                          <button
                            key={`${r.title}-${idx}`}
                            onClick={() => setPickedRecipe(idx)}
                            className={[
                              'w-full text-left rounded-2xl border p-4 transition',
                              active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[13px] font-semibold text-[#2f3a56]">{r.title}</div>
                                <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">{r.how}</div>
                              </div>
                              <span className="shrink-0 inline-flex items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
                                {r.tag}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveCurrentToMyDay(selectedRecipe?.title || 'Receita rápida')}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Salvar no Meu Dia
                      </button>
                      <button
                        type="button"
                        onClick={() => go('passo')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Ir para Passo leve
                      </button>
                      {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                    </div>
                  </div>
                ) : null}

                {/* PASSO LEVE */}
                {step === 'passo' ? (
                  <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-white p-5">
                    <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">escolha 1 passo</div>
                    <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                      Um passo único que fecha o agora.
                      <br />
                      O resto pode esperar.
                    </div>

                    <div className="mt-4 space-y-2">
                      {passosForNow.map((p, idx) => (
                        <CardChoice
                          key={`${p.title}-${idx}`}
                          title={p.title}
                          subtitle={p.why}
                          tag={`${p.slot} min`}
                          active={pickedPasso === idx}
                          onClick={() => setPickedPasso(idx)}
                        />
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveCurrentToMyDay(selectedPasso?.title || 'Passo leve')}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Salvar no Meu Dia
                      </button>
                      {saveFeedback ? <span className="text-[12px] text-[#6a6a6a]">{saveFeedback}</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </SoftCard>
          </div>
        </section>

        <div className="mt-6">
          <LegalFooter />
        </div>
      </div>
    </main>
  )
}
