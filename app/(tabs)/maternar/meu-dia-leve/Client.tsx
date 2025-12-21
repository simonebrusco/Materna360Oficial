'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'inspiracao' | 'ideias' | 'receitas' | 'passo'
type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'
type Focus = 'casa' | 'voce' | 'filho' | 'comida'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

const LS_RECENT_SAVE = 'my_day_recent_save_v1'

// Regras de liberação (segurança / responsabilidade)
const MIN_MONTHS_BLOCK = 6 // < 6: bloqueia total (aleitamento)
const MIN_MONTHS_INTRO_START = 6 // 6 a 11: introdução alimentar (bloqueia receitas do app)
const MIN_MONTHS_ALLOW_RECIPES = 12 // >= 12: libera receitas do app

// Prefixo real do seu hook useLocalStorage
const LS_PREFIX = 'm360:'

type RecentSavePayload = {
  ts: number
  origin: TaskOrigin
  source: string
}

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    // tenta sem prefixo e com prefixo (porque o projeto já tem os dois padrões espalhados)
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
    // sempre salva no padrão atual do app (prefixed)
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
  } catch {}
}

function safeSetJSON(key: string, value: unknown) {
  try {
    safeSetLS(key, JSON.stringify(value))
  } catch {}
}

function safeParseInt(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number.parseInt(String(v).trim(), 10)
  if (!Number.isFinite(n)) return null
  if (Number.isNaN(n)) return null
  return n
}

function safeParseJSON(raw: string | null): any | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function safeParseDate(v: unknown): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return null
  return d
}

function monthsBetween(from: Date, to: Date) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  return Math.max(0, months)
}

type ChildProfile = {
  id: string
  label: string
  months: number | null
}

// normaliza "3 anos" / "36 meses" etc, quando vier “solto”
function coerceMonthsFromUnknown(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, Math.min(240, Math.floor(v))) : null

  const s = String(v).trim().toLowerCase()
  if (!s) return null

  // exemplo: "36"
  const direct = safeParseInt(s)
  if (direct !== null) return Math.max(0, Math.min(240, direct))

  // exemplo: "3 anos"
  const mYears = s.match(/(\d+)\s*ano/)
  if (mYears?.[1]) return Math.max(0, Math.min(240, Number(mYears[1]) * 12))

  // exemplo: "8 meses"
  const mMonths = s.match(/(\d+)\s*mes/)
  if (mMonths?.[1]) return Math.max(0, Math.min(240, Number(mMonths[1])))

  return null
}

/**
 * Eu360: lê filhos e idades do localStorage (com prefixo m360:)
 * Suporta:
 * - chaves diretas (eu360_children, eu360_children_v1, etc)
 * - estado “profile” com children dentro
 * - fallback: varredura por chaves m360:eu360*
 */
function inferChildrenFromEu360(): ChildProfile[] {
  if (typeof window === 'undefined') return []

  const candidates = [
    'eu360_children',
    'eu360_children_v1',
    'eu360_kids',
    'eu360_kids_v1',
    'eu360_filhos',
    'eu360_filhos_v1',
    'eu360_profile',
    'eu360_profile_v1',
    'eu360_state',
    'eu360_data',
    'eu360_form',
    'eu360_form_v1',
  ]

  const collected: any[] = []

  // 1) tenta chaves candidatas
  for (const k of candidates) {
    const obj = safeParseJSON(safeGetLS(k))
    if (!obj) continue

    if (Array.isArray(obj)) {
      collected.push(...obj)
      continue
    }

    const arr =
      obj?.children ??
      obj?.kids ??
      obj?.filhos ??
      obj?.childs ??
      obj?.seusFilhos ??
      obj?.seus_filhos ??
      obj?.data?.children ??
      obj?.data?.kids ??
      obj?.data?.filhos

    if (Array.isArray(arr)) collected.push(...arr)
  }

  // 2) fallback: varre localStorage por prefixo m360:eu360
  if (collected.length === 0) {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (!k) continue
        if (!k.startsWith(`${LS_PREFIX}eu360`)) continue

        const raw = window.localStorage.getItem(k)
        const obj = safeParseJSON(raw)
        if (!obj) continue

        if (Array.isArray(obj)) {
          collected.push(...obj)
          continue
        }

        const arr =
          obj?.children ??
          obj?.kids ??
          obj?.filhos ??
          obj?.data?.children ??
          obj?.data?.kids ??
          obj?.data?.filhos

        if (Array.isArray(arr)) collected.push(...arr)
      }
    } catch {}
  }

  // 3) normaliza children
  const out: ChildProfile[] = []
  let idx = 1

  for (const c of collected) {
    const id = String(c?.id ?? c?.key ?? c?.uuid ?? `child_${idx++}`)
    const name = String(c?.name ?? c?.nome ?? '').trim()

    // Possíveis formatos
    const months =
      coerceMonthsFromUnknown(
        c?.ageMonths ??
          c?.age_months ??
          c?.months ??
          c?.idadeMeses ??
          c?.idade_meses ??
          c?.idade ??
          c?.age,
      ) ??
      (() => {
        const d =
          safeParseDate(
            c?.birthdate ??
              c?.birthDate ??
              c?.dob ??
              c?.dataNascimento ??
              c?.data_nascimento ??
              c?.nascimento,
          ) || null
        return d ? Math.max(0, Math.min(240, monthsBetween(d, new Date()))) : null
      })()

    const label = name ? name : `Filho ${out.length + 1}`

    // evita duplicados por id
    if (out.some((x) => x.id === id)) continue
    out.push({ id, label, months })
  }

  // se vier vazio, devolve []
  return out
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

function slotHint(s: Slot) {
  if (s === '3') return 'Para quando você está sem tempo e precisa destravar o agora.'
  if (s === '5') return 'Para quando dá para encaixar algo pequeno e útil entre tarefas.'
  return 'Para quando você consegue reorganizar o resto do dia com um passo simples.'
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

function inferContext(): { slot: Slot; mood: Mood; focus: Focus } {
  const slotRaw = safeGetLS('eu360_day_slot')
  const moodRaw = safeGetLS('eu360_mood')
  const focusRaw = safeGetLS('eu360_focus_today')

  const slot: Slot = slotRaw === '3' || slotRaw === '5' || slotRaw === '10' ? slotRaw : '5'
  const mood: Mood =
    moodRaw === 'no-limite' || moodRaw === 'corrida' || moodRaw === 'ok' || moodRaw === 'leve'
      ? moodRaw
      : 'corrida'
  const focus: Focus =
    focusRaw === 'casa' || focusRaw === 'voce' || focusRaw === 'filho' || focusRaw === 'comida'
      ? focusRaw
      : 'filho'

  if (mood === 'no-limite') return { slot: '3', mood, focus }
  return { slot, mood, focus }
}

type QuickIdea = { tag: string; title: string; how: string; slot: Slot; focus: Focus }
type QuickRecipe = { tag: string; title: string; how: string; slot: Slot }
type DayLine = { title: string; why: string; focus: Focus; slot: Slot }

const INSPIRATIONS: Record<Mood, { title: string; line: string; action: string }> = {
  'no-limite': { title: 'Para agora', line: 'Escolha uma coisa só. O resto pode esperar.', action: 'Defina 1 prioridade mínima.' },
  corrida: { title: 'Para hoje', line: 'O dia melhora quando você decide o próximo passo — não o dia inteiro.', action: 'Escolha o próximo passo.' },
  ok: { title: 'Para manter', line: 'Quando você simplifica, você ganha tempo de verdade.', action: 'Corte uma exigência.' },
  leve: { title: 'Para aproveitar', line: 'Dia leve não é dia perfeito. É dia bem conduzido.', action: 'Faça o básico bem feito.' },
}

const IDEIAS: QuickIdea[] = [
  { tag: '3 min', title: 'Respirar + ombros para baixo', how: '3 respirações lentas + relaxar ombros 3 vezes. Só isso.', slot: '3', focus: 'voce' },
  { tag: '3 min', title: 'Mensagem curta que resolve', how: 'Uma mensagem objetiva (sem texto longo) para destravar algo do dia.', slot: '3', focus: 'casa' },
  { tag: '5 min', title: 'Conexão com o filho (sem inventar)', how: 'Pergunta simples: “o que foi legal hoje?” + ouvir 20 segundos.', slot: '5', focus: 'filho' },
  { tag: '5 min', title: 'Organizar um ponto só', how: 'Uma bancada ou mesa. Não a casa toda.', slot: '5', focus: 'casa' },
  { tag: '10 min', title: 'Música + tarefa que já existe', how: 'Uma música e você faz uma tarefa que já faria de qualquer jeito.', slot: '10', focus: 'voce' },
  { tag: '10 min', title: 'Banho/escova em modo leve', how: 'Transforme a rotina em “missão” rápida e sem discussão.', slot: '10', focus: 'filho' },
  { tag: '5 min', title: 'Água + lanche simples', how: 'Água + algo pronto. Resolve energia sem complicar.', slot: '5', focus: 'comida' },
]

const RECEITAS: QuickRecipe[] = [
  { tag: '3 min', title: 'Iogurte + fruta + um crocante', how: 'Montagem rápida com o que tiver. Sem medida.', slot: '3' },
  { tag: '5 min', title: 'Ovo mexido + arroz pronto', how: 'Arroz já pronto + ovo mexido. Legume se der.', slot: '5' },
  { tag: '5 min', title: 'Pão + queijo + fruta', how: 'Simples e suficiente para uma rotina corrida.', slot: '5' },
  { tag: '10 min', title: 'Sopa/caldo pronto + final leve', how: 'Esquentar + montar bem. Resolve sem esticar o dia.', slot: '10' },
]

const PASSO_LEVE: DayLine[] = [
  { title: 'Resolver 1 coisa que está travando', why: 'O resto fica mais fácil quando algo destrava.', focus: 'casa', slot: '5' },
  { title: 'Fazer 5 min de conexão com o filho', why: 'Curto e intencional funciona melhor do que “tentar muito”.', focus: 'filho', slot: '5' },
  { title: 'Proteger 10 min só seus', why: 'Sem tela e sem tarefa. É recarregar para continuar.', focus: 'voce', slot: '10' },
  { title: 'Simplificar a refeição', why: 'Comida simples também é cuidado — e libera energia mental.', focus: 'comida', slot: '5' },
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

type AIRecipeResponse = { ok: boolean; text?: string; error?: string; hint?: string }

async function requestAIRecipe(input: { slot: Slot; mood: Mood; pantry: string; childAgeMonths: number }): Promise<AIRecipeResponse> {
  const res = await fetch('/api/ai/meu-dia-leve/receita', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot: input.slot, mood: input.mood, pantry: input.pantry, childAgeMonths: input.childAgeMonths }),
  })
  if (!res.ok) return { ok: false, error: `http_${res.status}` }
  return (await res.json()) as AIRecipeResponse
}

function formatChildLabel(c: ChildProfile) {
  const age =
    c.months === null ? 'idade não preenchida' : c.months < 24 ? `${c.months} meses` : `${Math.floor(c.months / 12)} anos`
  return `${c.label} • ${age}`
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

  // filhos / idades
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [activeChildId, setActiveChildId] = useState<string>('')

  const [pantry, setPantry] = useState<string>('')
  const [aiRecipeText, setAiRecipeText] = useState<string>('')
  const [aiRecipeLoading, setAiRecipeLoading] = useState<boolean>(false)
  const [aiRecipeError, setAiRecipeError] = useState<string>('')
  const [aiRecipeHint, setAiRecipeHint] = useState<string>('')

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

    const kids = inferChildrenFromEu360()
    setChildren(kids)

    // default: seleciona o filho “mais velho com idade” (para liberar quando houver)
    const withAge = kids.filter((k) => k.months !== null) as Array<ChildProfile & { months: number }>
    if (withAge.length) {
      const sorted = [...withAge].sort((a, b) => b.months - a.months)
      setActiveChildId(sorted[0].id)
    } else if (kids.length) {
      setActiveChildId(kids[0].id)
    } else {
      setActiveChildId('')
    }

    try {
      track('meu_dia_leve.open', {
        slot: inferred.slot,
        mood: inferred.mood,
        focus: inferred.focus,
        kidsCount: kids.length,
        kidsWithAge: withAge.length,
      })
    } catch {}
  }, [])

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
    safeSetLS('eu360_day_slot', next)
    setPickedIdea(0)
    setPickedRecipe(0)
    setPickedPasso(0)
    try {
      track('meu_dia_leve.slot.select', { slot: next })
    } catch {}
  }

  function onSelectMood(next: Mood) {
    setMood(next)
    safeSetLS('eu360_mood', next)
    if (next === 'no-limite') {
      setSlot('3')
      safeSetLS('eu360_day_slot', '3')
    }
    try {
      track('meu_dia_leve.mood.select', { mood: next })
    } catch {}
  }

  function onSelectFocus(next: Focus) {
    setFocus(next)
    safeSetLS('eu360_focus_today', next)
    setPickedIdea(0)
    setPickedRecipe(0)
    setPickedPasso(0)
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

    const res = addTaskToMyDay({ title, origin: ORIGIN, source: SOURCE })

    if (res.limitHit) {
      toast.info('Seu Meu Dia já está cheio hoje. Conclua ou adie algo antes de salvar mais.')
      try {
        track('my_day.task.add.blocked', { source: SOURCE, origin: ORIGIN, reason: 'open_tasks_limit_hit', dateKey: res.dateKey })
      } catch {}
      return
    }

    const payload: RecentSavePayload = { ts: Date.now(), origin: ORIGIN, source: SOURCE }
    safeSetJSON(LS_RECENT_SAVE, payload)

    if (res.created) {
      toast.success('Salvo no Meu Dia')
      setSaveFeedback('Salvo no Meu Dia.')
    } else {
      toast.info('Já estava no Meu Dia')
      setSaveFeedback('Essa tarefa já estava no Meu Dia.')
    }

    try {
      track('my_day.task.add', { ok: !!res.ok, created: !!res.created, origin: ORIGIN, source: SOURCE, dateKey: res.dateKey })
      track('meu_dia_leve.save_to_my_day', { origin: ORIGIN, created: res.created, dateKey: res.dateKey, source: SOURCE })
    } catch {}

    window.setTimeout(() => setSaveFeedback(''), 2200)
  }

  const activeChild = useMemo(() => {
    if (!children.length) return null
    const found = children.find((c) => c.id === activeChildId)
    return found ?? children[0]
  }, [children, activeChildId])

  const activeMonths = activeChild?.months ?? null

  // Gate central
  const gate = useMemo(() => {
    if (!children.length) {
      return {
        blocked: true,
        reason: 'no_children' as const,
        title: 'Para sugerir receitas com segurança',
        message: 'Complete o cadastro do(s) filho(s) no Eu360.',
      }
    }

    if (!activeChild) {
      return {
        blocked: true,
        reason: 'no_active' as const,
        title: 'Para sugerir receitas com segurança',
        message: 'Selecione um filho com idade preenchida no Eu360.',
      }
    }

    if (activeMonths === null) {
      return {
        blocked: true,
        reason: 'age_missing' as const,
        title: 'Para sugerir receitas com segurança',
        message: 'Complete a idade do(s) filho(s) no Eu360.',
      }
    }

    if (activeMonths < MIN_MONTHS_BLOCK) {
      return {
        blocked: true,
        reason: 'under_6' as const,
        title: 'Sem receitas por enquanto',
        message: 'Para bebês com menos de 6 meses, a referência é a orientação que você já usa com sua rede de saúde.',
      }
    }

    if (activeMonths >= MIN_MONTHS_INTRO_START && activeMonths < MIN_MONTHS_ALLOW_RECIPES) {
      return {
        blocked: true,
        reason: 'intro_6_11' as const,
        title: 'Introdução alimentar',
        message: 'Entre 6 e 11 meses, as orientações variam. Aqui, por enquanto, a gente não sugere receitas.',
      }
    }

    return { blocked: false, reason: 'ok' as const, title: '', message: '' }
  }, [children.length, activeChild, activeMonths])

  async function onGenerateAIRecipe() {
    setAiRecipeError('')
    setAiRecipeText('')
    setAiRecipeHint('')

    if (gate.blocked) {
      try {
        track('meu_dia_leve.recipe.blocked', { reason: gate.reason, activeMonths })
      } catch {}
      toast.info(gate.message || 'Complete a idade no Eu360 para liberar.')
      return
    }

    const trimmed = pantry.trim()
    if (!trimmed) {
      toast.info('Escreva curto o que você tem em casa.')
      return
    }

    setAiRecipeLoading(true)
    try {
      try {
        track('meu_dia_leve.recipe.request', { slot, mood, pantryLen: trimmed.length, activeMonths })
      } catch {}

      const data = await requestAIRecipe({ slot, mood, pantry: trimmed, childAgeMonths: activeMonths as number })

      if (!data?.ok || !data.text) {
        setAiRecipeError(data?.error || 'erro_receita')
        if (data?.hint) setAiRecipeHint(data.hint)

        toast.info(data?.hint || 'Não consegui montar agora. Se quiser, use uma opção pronta abaixo.')

        try {
          track('meu_dia_leve.recipe.fail', { error: data?.error || 'no_text' })
        } catch {}
        return
      }

      setAiRecipeText(data.text)
      try {
        track('meu_dia_leve.recipe.ok', { slot, mood })
      } catch {}
    } catch {
      setAiRecipeError('erro_rede')
      toast.info('Falhou agora. Se quiser, use uma opção pronta abaixo.')
      try {
        track('meu_dia_leve.recipe.fail', { error: 'network_or_throw' })
      } catch {}
    } finally {
      setAiRecipeLoading(false)
    }
  }

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
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1">
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Meu Dia Leve
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Você entra sem clareza e sai com um próximo passo simples para agora — sem ficar caçando.
              </p>
            </div>
          </header>

          <Reveal>
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
                        Passo {stepIndex(step)}/4 • {slotTitle(slot)} • {slotLabel(slot)} • foco {focusTitle(focus)}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Sugestão pronta para o seu agora
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">{slotHint(slot)}</div>
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
                          active ? 'bg-white/90 border-white/60 text-[#2f3a56]' : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
                        ].join(' ')}
                      >
                        {it.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 md:p-6">
                {saveFeedback ? (
                  <div className="mb-4 rounded-2xl bg-white/80 border border-white/50 px-4 py-3 text-[12px] text-[#2f3a56] flex items-center justify-between gap-3">
                    <span>{saveFeedback}</span>
                    <Link
                      href="/meu-dia"
                      className="rounded-full bg-[#fd2597] text-white px-3 py-1.5 text-[12px] font-semibold shadow-lg hover:opacity-95 transition"
                    >
                      Ir para Meu Dia
                    </Link>
                  </div>
                ) : null}

                {/* INSPIRACAO */}
                {step === 'inspiracao' ? (
                  <div id="inspiracao" className="space-y-4">
                    <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Inspiração do dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">{moodTitle(mood)}</h2>
                          <p className="text-[13px] text-[#6a6a6a]">Uma linha para organizar o próximo passo. Sem alongar.</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">{inspiration.title}</div>
                        <div className="mt-2 text-[16px] md:text-[18px] font-semibold text-[#2f3a56] leading-relaxed">{inspiration.line}</div>
                        <div className="mt-3 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Ação: <span className="font-semibold text-[#2f3a56]">{inspiration.action}</span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('ideias')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Ver ideia pronta
                          </button>
                          <button
                            onClick={() => go('passo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir direto ao passo leve
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* IDEIAS */}
                {step === 'ideias' ? (
                  <div id="ideias" className="space-y-4">
                    <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="sun" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Ideias rápidas
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Escolha uma (e pronto)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Aqui é para te dar <span className="font-semibold">uma</span> coisa possível agora.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {ideasForNow.map((i, idx) => (
                          <CardChoice
                            key={`${i.title}-${idx}`}
                            tag={`${i.tag} • ${focusTitle(i.focus)}`}
                            title={i.title}
                            subtitle={i.how}
                            active={pickedIdea === idx}
                            onClick={() => setPickedIdea(idx)}
                          />
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">faça agora</div>
                        <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{selectedIdea?.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedIdea?.how}</div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (selectedIdea?.title) saveCurrentToMyDay(selectedIdea.title)
                            }}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('passo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar com um passo leve
                          </button>

                          <button
                            onClick={() => go('receitas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver receitas rápidas
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* RECEITAS */}
                {step === 'receitas' ? (
                  <div id="receitas" className="space-y-4">
                    <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Receitas rápidas
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Uma receita simples para agora</h2>
                          <p className="text-[13px] text-[#6a6a6a]">Você escreve o que tem. O Materna devolve uma receita curta, com modo de fazer.</p>
                        </div>
                      </div>

                      {/* Seleção do filho (quando houver mais de um) */}
                      {children.length ? (
                        <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-white p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">para qual filho?</div>
                          <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                            Para sugerir com segurança, o Materna usa a idade do Eu360.
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {children.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setActiveChildId(c.id)
                                  setAiRecipeText('')
                                  setAiRecipeError('')
                                  setAiRecipeHint('')
                                  try {
                                    track('meu_dia_leve.recipe.child.select', { childId: c.id, months: c.months })
                                  } catch {}
                                }}
                                className={[
                                  'rounded-full px-3 py-1.5 text-[12px] border transition',
                                  (activeChild?.id === c.id)
                                    ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                                    : 'bg-white border-[#f5d7e5] text-[#2f3a56] hover:bg-[#ffe1f1]',
                                ].join(' ')}
                              >
                                {formatChildLabel(c)}
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href="/eu360"
                              className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                            >
                              Atualizar no Eu360
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">observação</div>
                          <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                            Para sugerir receitas com segurança, complete o cadastro do(s) filho(s) no Eu360.
                          </div>
                          <div className="mt-3">
                            <Link
                              href="/eu360"
                              className="inline-flex rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                            >
                              Ir para Eu360
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Gate message */}
                      {gate.blocked ? (
                        <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">{gate.title}</div>
                          <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{gate.message}</div>
                        </div>
                      ) : null}

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-white p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">o que você tem em casa</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">Escreva curto. Ex.: “ovo, arroz, cenoura”.</div>

                        <textarea
                          value={pantry}
                          onChange={(e) => setPantry(e.target.value)}
                          rows={3}
                          placeholder="o que tenho em casa…"
                          className="mt-3 w-full rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-4 py-3 text-[13px] text-[#2f3a56] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={onGenerateAIRecipe}
                            disabled={aiRecipeLoading || gate.blocked}
                            className={[
                              'rounded-full px-4 py-2 text-[12px] shadow-lg transition',
                              (aiRecipeLoading || gate.blocked)
                                ? 'bg-[#fd2597]/50 text-white cursor-not-allowed'
                                : 'bg-[#fd2597] text-white hover:opacity-95',
                            ].join(' ')}
                          >
                            {aiRecipeLoading ? 'Gerando…' : 'Gerar receita'}
                          </button>

                          {gate.blocked ? (
                            <span className="text-[12px] text-[#6a6a6a]">Complete a idade no Eu360 para liberar.</span>
                          ) : null}

                          {aiRecipeHint ? (
                            <span className="text-[12px] text-[#6a6a6a]">{aiRecipeHint}</span>
                          ) : null}

                          {aiRecipeError && !aiRecipeHint ? (
                            <span className="text-[12px] text-[#6a6a6a]">Falhou agora. Você ainda pode usar uma opção pronta abaixo.</span>
                          ) : null}
                        </div>

                        {aiRecipeText ? (
                          <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                            <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">receita pronta</div>
                            <div className="mt-2 text-[13px] text-[#2f3a56] leading-relaxed whitespace-pre-wrap">{aiRecipeText}</div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => saveCurrentToMyDay('Receita rápida (criança)')}
                                className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                              >
                                Salvar no Meu Dia
                              </button>

                              <button
                                onClick={() => go('passo')}
                                className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                              >
                                Fechar com o passo leve
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-2">
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

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">opção pronta</div>
                        <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{selectedRecipe?.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedRecipe?.how}</div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (selectedRecipe?.title) saveCurrentToMyDay(selectedRecipe.title)
                            }}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('passo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar com o passo leve
                          </button>

                          <button
                            onClick={() => go('ideias')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar para ideias
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* PASSO */}
                {step === 'passo' ? (
                  <div id="passo" className="space-y-4">
                    <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="star" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Passo leve do dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Escolha um (e encerre)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">Um passo pequeno já muda o clima do dia.</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {passosForNow.map((p, idx) => (
                          <CardChoice
                            key={`${p.title}-${idx}`}
                            tag={`${slotLabel(p.slot)} • ${focusTitle(p.focus)}`}
                            title={p.title}
                            subtitle={p.why}
                            active={pickedPasso === idx}
                            onClick={() => setPickedPasso(idx)}
                          />
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-6">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">seu passo de hoje</div>
                        <div className="mt-2 text-[15px] font-semibold text-[#2f3a56]">{selectedPasso?.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedPasso?.why}</div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (selectedPasso?.title) saveCurrentToMyDay(selectedPasso.title)
                            }}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <Link
                            href="/meu-dia"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir para Meu Dia
                          </Link>

                          <Link
                            href="/maternar"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar ao Maternar
                          </Link>
                        </div>

                        <div className="mt-4 text-[12px] text-[#6a6a6a]">Fechou. Um passo leve já é suficiente por hoje.</div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}
              </div>
            </section>
          </Reveal>

          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
