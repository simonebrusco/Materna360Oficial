// app/(tabs)/maternar/cuidar-de-mim/Client.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { ClientOnly } from '@/components/common/ClientOnly'

import { track } from '@/app/lib/telemetry'
import { load, save } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'

import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import { readMyDayCountsToday } from '@/app/lib/myDayCounts.client'
import { getCareGuidance } from '@/app/lib/cuidarDeMimGuidance'

import {
  addTaskToMyDay,
  listMyDayTasks,
  MY_DAY_SOURCES,
  type MyDayTaskItem,
} from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'

import ParaAgoraSupportCard from '@/components/cuidar-de-mim/ParaAgoraSupportCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'confusa' | 'ok'

/**
 * Governança:
 * - Cuidar de Mim é a casa oficial do check-in.
 * - Mantém leitura compat do legado eu360_ritmo, mas grava no persist.
 */
const PERSIST_KEYS = {
  cuidarDeMimRitmo: 'cuidar_de_mim.ritmo.v1',

  // ✅ novo: estado do “Plano para agora” (variação + limite diário)
  cdmPlanState: 'cuidar_de_mim.para_agora.plan.v1',
} as const

const LEGACY_LS_KEYS = {
  eu360Ritmo: 'eu360_ritmo',
} as const

type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
}

type DaySignals = {
  savedCount: number
  commitmentsCount: number
  laterCount: number
}

/** Fallback obrigatório da governança (sem IA, sem variação). */
const GUIDANCE_FALLBACK = 'Agora é um bom momento para simplificar. Um passo já ajuda.'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function inferRitmo(): Ritmo {
  // 1) Novo padrão (persist)
  try {
    const v = load<string>(PERSIST_KEYS.cuidarDeMimRitmo)
    if (v === 'leve' || v === 'cansada' || v === 'confusa' || v === 'ok') return v
  } catch {}

  // 2) Legado (compat)
  const raw = safeGetLS(LEGACY_LS_KEYS.eu360Ritmo)
  if (raw === 'leve') return 'leve'
  if (raw === 'cansada') return 'cansada'
  if (raw === 'confusa') return 'confusa'
  if (raw === 'ok') return 'ok'
  if (raw === 'sobrecarregada') return 'cansada'
  if (raw === 'animada') return 'ok'

  return 'cansada'
}

function setRitmoPersist(r: Ritmo) {
  try {
    save(PERSIST_KEYS.cuidarDeMimRitmo, r)
  } catch {}
}

/**
 * Compromissos (real):
 * - Fonte: planner/appointments/all
 * - Count: appointments com dateKey === todayKey
 */
function readCommitmentsTodayFromPlanner(): number {
  try {
    const todayKey = getBrazilDateKey(new Date())
    const all = load<Appointment[]>('planner/appointments/all', []) ?? []
    if (!Array.isArray(all)) return 0
    return all.filter((a) => a?.dateKey === todayKey).length
  } catch {
    return 0
  }
}

/**
 * BLOCO 2 — integração real mínima e segura:
 * - Salvos e Para depois: via helper oficial readMyDayCountsToday()
 * - Compromissos: via planner/appointments/all
 */
function readDaySignals(): DaySignals {
  try {
    const counts = readMyDayCountsToday()
    const commitments = readCommitmentsTodayFromPlanner()

    return {
      savedCount: typeof counts.savedToday === 'number' ? counts.savedToday : 0,
      laterCount: typeof counts.laterToday === 'number' ? counts.laterToday : 0,
      commitmentsCount: commitments,
    }
  } catch {
    return { savedCount: 0, commitmentsCount: 0, laterCount: 0 }
  }
}

/* =========================
   P34.10 — Legibilidade Mobile
========================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []
  const text = String(raw).trim()
  if (!text) return []

  const markers = ['No final,', 'No fim,', 'Depois,', 'Em seguida,', 'Por fim,']

  let working = text
  markers.forEach((m) => {
    working = working.replace(new RegExp(`\\s*${m}`, 'g'), `\n\n${m}`)
  })

  const parts = working
    .split(/\n\n|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return parts.slice(0, 3)
}

function RenderEditorialText({
  text,
  className,
}: {
  text: string | null | undefined
  className: string
}) {
  const parts = splitEditorialText(text)
  if (parts.length === 0) return null

  return (
    <div className="space-y-2">
      {parts.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </div>
  )
}

/* =========================
   “Plano para agora” (estrutura inteligente)
   - 1 plano selecionado
   - botão Trocar (variação)
   - botão Ver 3 opções
   - limitador diário de trocas
   - salvar no Meu Dia (limitador 3/dia do hub)
========================= */

type PlanItem = { id: string; title: string; how: string; ritmo: Ritmo }

const PLAN_POOL: Record<Ritmo, PlanItem[]> = {
  cansada: [
    { id: 'c1', title: 'Água + 3 respirações', how: 'Beba um gole. Faça 3 respirações lentas. Só isso.', ritmo: 'cansada' },
    { id: 'c2', title: 'Fechar uma aba mental', how: 'Escolha 1 coisa que pode esperar. Diga “isso fica para depois”.', ritmo: 'cansada' },
    { id: 'c3', title: 'Micro ordem (1 ponto)', how: 'Arrume só um ponto visível (bancada / sofá). Pare quando terminar.', ritmo: 'cansada' },
    { id: 'c4', title: 'Mensagem objetiva que resolve', how: 'Uma mensagem curta para destravar algo. Sem explicar demais.', ritmo: 'cansada' },
    { id: 'c5', title: 'Pausa de corpo (30s)', how: 'Ombros para baixo 3 vezes. Solte a mandíbula. Volte.', ritmo: 'cansada' },
    { id: 'c6', title: 'Uma decisão mínima', how: 'Escolha o próximo passo. Não o dia inteiro.', ritmo: 'cansada' },
    { id: 'c7', title: 'Simplificar a refeição', how: 'Escolha o caminho mais fácil. “Bom o suficiente” já alimenta.', ritmo: 'cansada' },
    { id: 'c8', title: 'Desligar um ruído', how: 'Reduza um estímulo (volume, notificações, uma luz).', ritmo: 'cansada' },
    { id: 'c9', title: 'Conexão curta (20s)', how: 'Olhe e diga: “Estou aqui.” Só presença curta, sem conversa longa.', ritmo: 'cansada' },
    { id: 'c10', title: 'Encerrar por aqui (vale)', how: 'Se hoje não couber, fechar agora já é cuidado.', ritmo: 'cansada' },
  ],
  confusa: [
    { id: 'f1', title: 'Nomear o que está acontecendo', how: 'Em 1 frase: “Estou confusa porque…”. Só para organizar a cabeça.', ritmo: 'confusa' },
    { id: 'f2', title: 'Escolher 1 prioridade mínima', how: 'Defina 1 coisa que, feita, melhora o resto. Só uma.', ritmo: 'confusa' },
    { id: 'f3', title: 'Escrever 3 bullets', how: 'Anote 3 pontos do que te preocupa. Sem resolver agora.', ritmo: 'confusa' },
    { id: 'f4', title: 'Reduzir opções', how: 'Corte uma escolha. Se tiver 3 caminhos, fique com 1.', ritmo: 'confusa' },
    { id: 'f5', title: 'Voltar para o corpo', how: 'Respiração 4-4-4: inspira 4, segura 4, solta 4. 3 vezes.', ritmo: 'confusa' },
    { id: 'f6', title: 'Próximo passo visível', how: 'O que dá para fazer em 5 minutos? Só isso.', ritmo: 'confusa' },
    { id: 'f7', title: 'Mensagem de alinhamento', how: 'Se precisar, diga: “Hoje preciso de X. Pode ser assim?”.', ritmo: 'confusa' },
    { id: 'f8', title: 'Uma coisa fora da cabeça', how: 'Tire 1 coisa do caminho (lixo, roupa, mesa). Só uma.', ritmo: 'confusa' },
    { id: 'f9', title: 'Pausa sem tela', how: '1 minuto sem tela. Olhar longe. Voltar.', ritmo: 'confusa' },
    { id: 'f10', title: 'Encerrar por aqui (vale)', how: 'Se não servir agora, fechar é uma escolha válida.', ritmo: 'confusa' },
  ],
  ok: [
    { id: 'o1', title: 'Manter o dia fluindo', how: 'Escolha 1 tarefa rápida que já existia e faça sem perfeição.', ritmo: 'ok' },
    { id: 'o2', title: 'Organizar 1 transição', how: 'Antecipe com 1 frase: “Daqui a pouco vamos…”.', ritmo: 'ok' },
    { id: 'o3', title: 'Proteger 5 min seus', how: '5 minutos só seus. Sem tela. Sem tarefa. Só recarregar.', ritmo: 'ok' },
    { id: 'o4', title: 'Conexão curta com o filho', how: 'Pergunta simples: “o que foi legal hoje?”. Ouça 20 segundos.', ritmo: 'ok' },
    { id: 'o5', title: 'Simplificar uma exigência', how: 'O que você pode fazer “bom o suficiente” hoje?', ritmo: 'ok' },
    { id: 'o6', title: 'Fechar um pendente', how: 'Resolva 1 pendência pequena. Só uma.', ritmo: 'ok' },
    { id: 'o7', title: 'Energia básica', how: 'Água + um lanche simples. Evita queda de energia.', ritmo: 'ok' },
    { id: 'o8', title: 'Um gesto de autocuidado', how: 'Passar creme / alongar / respirar. Um gesto pequeno.', ritmo: 'ok' },
    { id: 'o9', title: 'Revisar o “para depois”', how: 'Escolha 1 coisa que pode esperar e libere espaço mental.', ritmo: 'ok' },
    { id: 'o10', title: 'Encerrar por aqui (vale)', how: 'Se hoje estiver bom, parar antes do limite preserva o clima.', ritmo: 'ok' },
  ],
  leve: [
    { id: 'l1', title: 'Aproveitar sem exagerar', how: 'Escolha 1 coisa que deixa tudo mais leve e faça só isso.', ritmo: 'leve' },
    { id: 'l2', title: 'Conexão intencional', how: '5 min de presença real com seu filho. Sem multitarefa.', ritmo: 'leve' },
    { id: 'l3', title: 'Preparar o amanhã (1 ponto)', how: 'Deixe 1 coisa pronta (roupa, bolsa, mesa). Pare aí.', ritmo: 'leve' },
    { id: 'l4', title: 'Um gesto de cuidado seu', how: 'Algo pequeno para você: banho demorado, música, respiração.', ritmo: 'leve' },
    { id: 'l5', title: 'Casa em modo mínimo', how: 'Organize só o que impacta o dia (um ponto visível).', ritmo: 'leve' },
    { id: 'l6', title: 'Registrar uma vitória', how: 'Em 1 frase: “Hoje eu consegui…”. Guardar isso ajuda.', ritmo: 'leve' },
    { id: 'l7', title: 'Reduzir estímulos', how: 'Menos telas/sons por 10 min. Mantém o dia leve.', ritmo: 'leve' },
    { id: 'l8', title: 'Planejar 1 prazer simples', how: 'Algo gostoso e possível: café, caminhada curta, música.', ritmo: 'leve' },
    { id: 'l9', title: 'Rotina mais previsível', how: 'Avise a próxima etapa com antecedência curta.', ritmo: 'leve' },
    { id: 'l10', title: 'Encerrar por aqui (vale)', how: 'Parar enquanto está bom também é cuidado.', ritmo: 'leve' },
  ],
}

type PlanPersist = {
  dateKey: string
  ritmo: Ritmo
  baseIndex: number
  swapsUsed: number
  pickedId?: string
}

const PLAN_SWAP_LIMIT_PER_DAY = 6
const MY_DAY_LIMIT_FROM_CUIDAR_DE_MIM_PER_DAY = 3

function hashToIndex(input: string, len: number): number {
  if (len <= 0) return 0
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % len
}

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  const s = (t as any).status
  if (s === 'active' || s === 'snoozed' || s === 'done') return s
  if ((t as any).done === true) return 'done'
  return 'active'
}

function countActiveFromSourceToday(tasks: MyDayTaskItem[], source: string) {
  return tasks.filter((t) => {
    const isFrom = (t as any).source === source
    const isActive = statusOf(t) === 'active'
    return isFrom && isActive
  }).length
}

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0
  if (i < 0) return 0
  if (i >= len) return len - 1
  return i
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [daySignals, setDaySignals] = useState<DaySignals>(() => ({
    savedCount: 0,
    commitmentsCount: 0,
    laterCount: 0,
  }))

  // ✅ novo estado do plano “para agora”
  const [planSelected, setPlanSelected] = useState<PlanItem | null>(null)
  const [planOptions, setPlanOptions] = useState<PlanItem[]>([])
  const [planFeedback, setPlanFeedback] = useState<string>('')
  const [planHint, setPlanHint] = useState<string>('')

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  /** BLOCO 3 — governança: texto vindo do helper oficial + fallback obrigatório */
  const guidance = useMemo(() => {
    try {
      const out = getCareGuidance({
        ritmo,
        savedCount: daySignals.savedCount ?? 0,
      })
      const text = (out?.text ?? '').trim()
      return {
        title: (out?.title ?? 'Hoje, um norte simples').trim() || 'Hoje, um norte simples',
        text: text || GUIDANCE_FALLBACK,
      }
    } catch {
      return { title: 'Hoje, um norte simples', text: GUIDANCE_FALLBACK }
    }
  }, [ritmo, daySignals.savedCount])

  useEffect(() => {
    try {
      track('nav.view', { page: 'maternar.cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    const r = inferRitmo()
    setRitmo(r)

    const s = readDaySignals()
    setDaySignals(s)

    // ✅ recuperar (ou inicializar) o plano do dia, sem gerar automaticamente em load
    try {
      const todayKey = getBrazilDateKey(new Date())
      const existing = load<PlanPersist | null>(PERSIST_KEYS.cdmPlanState, null)

      if (existing && existing.dateKey === todayKey && (existing.ritmo === r)) {
        const pool = PLAN_POOL[r] ?? []
        const baseIndex = clampIndex(existing.baseIndex ?? 0, pool.length)
        const picked =
          (existing.pickedId ? pool.find((p) => p.id === existing.pickedId) : null) ??
          pool[baseIndex] ??
          null

        setPlanSelected(picked)
        setPlanHint('')
      } else {
        // não seleciona nada automaticamente: só prepara hint leve
        setPlanSelected(null)
        setPlanOptions([])
        setPlanHint('Quando você quiser, eu te dou um plano simples para agora. Sem obrigação.')
      }
    } catch {
      setPlanSelected(null)
      setPlanOptions([])
      setPlanHint('Quando você quiser, eu te dou um plano simples para agora. Sem obrigação.')
    }

    try {
      track('cuidar_de_mim.open', {
        ritmo: r,
        saved: s.savedCount,
        commitments: s.commitmentsCount,
        later: s.laterCount,
      })
    } catch {}
  }, [])

  function onPickRitmo(next: Ritmo) {
    setRitmo(next)
    setRitmoPersist(next)

    // ao trocar ritmo, mantém o plano “manual” (sem auto-gerar),
    // mas limpa opções para evitar mistura de contexto.
    setPlanOptions([])
    setPlanHint('Se quiser, gere um plano novo para agora.')
    try {
      track('cuidar_de_mim.checkin.select', { ritmo: next })
    } catch {}
  }

  const stat = (n: number | null | undefined) => (typeof n === 'number' ? String(n) : '—')

  const scrollToSection = (id: string, label?: string) => {
    try {
      if (label) track('cuidar_de_mim.top.chip', { label, target: id })
    } catch {}

    try {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {}
  }

  function flash(msg: string, ms = 2400) {
    setPlanFeedback(msg)
    window.setTimeout(() => setPlanFeedback(''), ms)
  }

  function readPlanPersist(): PlanPersist | null {
  try {
    const v = load<PlanPersist | null>(PERSIST_KEYS.cdmPlanState, null)
    return v ?? null
  } catch {
    return null
  }
}

  function writePlanPersist(next: PlanPersist) {
    try {
      save(PERSIST_KEYS.cdmPlanState, next)
    } catch {}
  }

  function ensureTodayPlanBase(): PlanPersist {
    const todayKey = getBrazilDateKey(new Date())
    const pool = PLAN_POOL[ritmo] ?? []
    const base = hashToIndex(`${todayKey}:${ritmo}:cdm`, pool.length)

    const current = readPlanPersist()
    if (current && current.dateKey === todayKey && current.ritmo === ritmo) return current

    const next: PlanPersist = {
      dateKey: todayKey,
      ritmo,
      baseIndex: base,
      swapsUsed: 0,
    }
    writePlanPersist(next)
    return next
  }

  function pickFromPool(index: number): PlanItem | null {
    const pool = PLAN_POOL[ritmo] ?? []
    if (!pool.length) return null
    const safe = ((index % pool.length) + pool.length) % pool.length
    return pool[safe] ?? null
  }

  function onGeneratePlan() {
    const st = ensureTodayPlanBase()
    const pool = PLAN_POOL[ritmo] ?? []

    if (!pool.length) {
      setPlanHint('Não consegui gerar agora. Tente novamente.')
      try {
        track('cuidar_de_mim.plan.generate.fail', { reason: 'empty_pool', ritmo })
      } catch {}
      return
    }

    const picked = pickFromPool(st.baseIndex)
    setPlanSelected(picked)
    setPlanOptions([])
    setPlanHint('')

    writePlanPersist({ ...st, pickedId: picked?.id })

    try {
      track('cuidar_de_mim.plan.generate', { ritmo, baseIndex: st.baseIndex })
    } catch {}
  }

  function onSwapPlan() {
    const st = ensureTodayPlanBase()
    const todayKey = st.dateKey

    if (st.swapsUsed >= PLAN_SWAP_LIMIT_PER_DAY) {
      flash('Hoje você já trocou bastante. Amanhã tem novas opções.', 3200)
      try {
        track('cuidar_de_mim.plan.swap.blocked', {
          reason: 'daily_swap_limit',
          limit: PLAN_SWAP_LIMIT_PER_DAY,
          swapsUsed: st.swapsUsed,
          dateKey: todayKey,
          ritmo,
        })
      } catch {}
      return
    }

    const nextIndex = (st.baseIndex + 1) % Math.max(1, (PLAN_POOL[ritmo] ?? []).length)
    const picked = pickFromPool(nextIndex)

    setPlanSelected(picked)
    setPlanOptions([])
    setPlanHint('')
    writePlanPersist({
      ...st,
      baseIndex: nextIndex,
      swapsUsed: st.swapsUsed + 1,
      pickedId: picked?.id,
    })

    try {
      track('cuidar_de_mim.plan.swap', {
        ritmo,
        nextIndex,
        swapsUsed: st.swapsUsed + 1,
        dateKey: todayKey,
      })
    } catch {}
  }

  function onShow3Options() {
    const st = ensureTodayPlanBase()
    const pool = PLAN_POOL[ritmo] ?? []
    if (!pool.length) return

    // 3 próximas opções a partir do baseIndex (sem repetir a selecionada, se der)
    const base = st.baseIndex
    const out: PlanItem[] = [] a
    for (let k = 1; k <= 5 && out.length < 3; k++) {
      const it = pickFromPool(base + k)
      if (!it) continue
      if (planSelected?.id && it.id === planSelected.id) continue
      if (out.some((x) => x.id === it.id)) continue
      out.push(it)
    }

    setPlanOptions(out)
    try {
      track('cuidar_de_mim.plan.options.show', { ritmo, count: out.length })
    } catch {}
  }

  function onPickOption(it: PlanItem) {
    setPlanSelected(it)
    setPlanOptions([])
    setPlanHint('')

    const st = ensureTodayPlanBase()
    writePlanPersist({ ...st, pickedId: it.id })

    try {
      track('cuidar_de_mim.plan.option.pick', { ritmo, id: it.id })
    } catch {}
  }

  function savePlanToMyDay() {
    if (!planSelected?.title) return

    const SOURCE = MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM
    const ORIGIN = 'selfcare' as const

    const today = listMyDayTasks()
    const activeCount = countActiveFromSourceToday(today, SOURCE)

    if (activeCount >= MY_DAY_LIMIT_FROM_CUIDAR_DE_MIM_PER_DAY) {
      flash('Você já salvou 3 ações do Cuidar de Mim hoje. Conclua uma. Ou escolha só 1 para agora.', 3600)
      try {
        track('my_day.task.add.blocked', {
          source: SOURCE,
          origin: ORIGIN,
          reason: 'limit_reached',
          limit: MY_DAY_LIMIT_FROM_CUIDAR_DE_MIM_PER_DAY,
        })
      } catch {}
      return
    }

    const res = addTaskToMyDay({ title: planSelected.title, origin: ORIGIN, source: SOURCE })

    if (res.limitHit) {
      flash('Seu Meu Dia já está cheio hoje. Conclua ou adie algo antes de salvar mais.', 3600)
      try {
        track('my_day.task.add.blocked', {
          source: SOURCE,
          origin: ORIGIN,
          reason: 'open_tasks_limit_hit',
          dateKey: res.dateKey,
        })
      } catch {}
      return
    }

    markRecentMyDaySave({ origin: ORIGIN, source: SOURCE })

    if (res.created) flash('Salvo no Meu Dia.')
    else flash('Essa tarefa já estava no Meu Dia.')

    try {
      track('my_day.task.add', {
        ok: !!res.ok,
        created: !!res.created,
        origin: ORIGIN,
        source: SOURCE,
        dateKey: res.dateKey,
      })
      track('cuidar_de_mim.plan.save_to_my_day', {
        created: res.created,
        dateKey: res.dateKey,
        source: SOURCE,
        ritmo,
      })
    } catch {}
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="relative min-h-[100dvh] pb-32 overflow-hidden eu360-hub-bg"
    >
      <ClientOnly>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <Link
              href="/maternar"
              className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition"
            >
              <span className="mr-1.5 text-lg leading-none">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
              Cuidar de Mim
            </h1>

            <RenderEditorialText
              text="Um espaço para pausar. Entender o dia como ele está. Seguir com mais clareza."
              className="mt-1 text-sm md:text-base text-white/90 max-w-2xl leading-relaxed"
            />
          </header>

          <section className="w-full">
            <div
              className="
                rounded-[28px]
                border border-white/25
                bg-white/12
                backdrop-blur
                shadow-[0_22px_70px_rgba(184,35,107,0.22)]
                p-3 sm:p-4 md:p-5
              "
            >
              <div
                className="
                  rounded-[22px]
                  border border-white/20
                  bg-white/12
                  backdrop-blur
                  px-4 py-3
                  sm:px-5 sm:py-4
                "
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 h-10 w-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                      <AppIcon name="heart" size={18} className="text-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/85 font-semibold">
                        Sugestão pronta para agora (sem obrigação)
                      </div>
                      <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-white leading-tight">
                        Um apoio para este momento
                      </div>

                      <RenderEditorialText
                        text={`Pequeno e prático. Sem cobrança.\n\nSe não servir, troque ou feche por aqui.`}
                        className="mt-1 text-[12px] md:text-[13px] text-white/85 max-w-[56ch] leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 sm:mt-0 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          track('cuidar_de_mim.top.adjust', { ritmo })
                        } catch {}
                        scrollToSection('cdm-ritmo', 'Ritmo')
                      }}
                      className="
                        rounded-full
                        bg-white/90
                        text-[#2f3a56]
                        px-4 py-2
                        text-[12px] font-semibold
                        shadow-[0_10px_22px_rgba(0,0,0,0.10)]
                        hover:bg-white
                        transition
                      "
                    >
                      Ajustar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          track('cuidar_de_mim.top.start', { ritmo })
                        } catch {}
                        scrollToSection('cdm-para-agora', 'Começar')
                      }}
                      className="
                        rounded-full
                        bg-[#fd2597]
                        text-white
                        px-4 py-2
                        text-[12px] font-semibold
                        shadow-[0_10px_26px_rgba(253,37,151,0.22)]
                        hover:opacity-95
                        transition
                      "
                    >
                      Começar
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollToSection('cdm-para-agora', 'Para agora')}
                    className="
                      inline-flex items-center
                      rounded-full
                      bg-white/10
                      border border-white/20
                      px-2.5 py-0.5
                      text-[10px]
                      text-white/90
                      hover:bg-white/15
                      transition
                    "
                  >
                    Para agora
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('cdm-ritmo', 'Ritmo')}
                    className="
                      inline-flex items-center
                      rounded-full
                      bg-white/10
                      border border-white/20
                      px-2.5 py-0.5
                      text-[10px]
                      text-white/90
                      hover:bg-white/15
                      transition
                    "
                  >
                    Ritmo
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('cdm-dia', 'Dia')}
                    className="
                      inline-flex items-center
                      rounded-full
                      bg-white/10
                      border border-white/20
                      px-2.5 py-0.5
                      text-[10px]
                      text-white/90
                      hover:bg-white/15
                      transition
                    "
                  >
                    Dia
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('cdm-norte', 'Norte')}
                    className="
                      inline-flex items-center
                      rounded-full
                      bg-white/10
                      border border-white/20
                      px-2.5 py-0.5
                      text-[10px]
                      text-white/90
                      hover:bg-white/15
                      transition
                    "
                  >
                    Norte
                  </button>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 rounded-[24px] bg-white/95 backdrop-blur border border-[#f5d7e5] shadow-[0_18px_45px_rgba(184,35,107,0.14)]">
                <div className="p-4 sm:p-5 md:p-7">
                  {/* BLOCO 0 — PARA AGORA */}
                  <section className="pb-6" id="cdm-para-agora">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="hub-eyebrow text-[#b8236b]">PARA AGORA</div>
                        <div className="hub-subtitle text-[#6a6a6a]">Pequeno, prático e sem cobrança.</div>

                        <div className="mt-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch">
                            <ParaAgoraSupportCard variant="embedded" className="h-full" />

                            {/* ✅ NOVO: Estrutura inteligente (plano + 3 opções + salvar) */}
                            <div className="h-full rounded-2xl bg-white/60 backdrop-blur border border-[#f5d7e5]/70 shadow-[0_10px_26px_rgba(184,35,107,0.08)] p-4 sm:p-5 md:p-6">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#ffe1f1]/80 border border-[#f5d7e5]/70 flex items-center justify-center shrink-0">
                                  <AppIcon name="sparkles" size={20} className="text-[#b8236b]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                                    Plano para agora
                                  </div>

                                  {!planSelected ? (
                                    <div className="mt-2">
                                      <div className="text-[13px] text-[#6a6a6a] leading-relaxed">
                                        {planHint || 'Quando você quiser, eu te dou um plano simples para agora.'}
                                      </div>

                                      <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={onGeneratePlan}
                                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] font-semibold shadow-[0_10px_26px_rgba(253,37,151,0.22)] hover:opacity-95 transition"
                                        >
                                          Gerar plano para agora
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            try {
                                              track('cuidar_de_mim.plan.close', { ritmo })
                                            } catch {}
                                            flash('Tudo bem. Se não couber agora, fechar já é cuidado.')
                                          }}
                                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] font-semibold hover:bg-[#fff3f8] transition"
                                        >
                                          Encerrar por aqui
                                        </button>

                                        {planFeedback ? (
                                          <span className="text-[12px] text-[#6a6a6a]">{planFeedback}</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-2">
                                      <div className="text-[15px] font-semibold text-[#2f3a56] leading-snug">
                                        {planSelected.title}
                                      </div>
                                      <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                                        {planSelected.how}
                                      </div>

                                      <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={savePlanToMyDay}
                                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] font-semibold shadow-[0_10px_26px_rgba(253,37,151,0.22)] hover:opacity-95 transition"
                                        >
                                          Salvar no Meu Dia
                                        </button>

                                        <button
                                          type="button"
                                          onClick={onSwapPlan}
                                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] font-semibold hover:bg-[#fff3f8] transition"
                                        >
                                          Trocar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={onShow3Options}
                                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] font-semibold hover:bg-[#fff3f8] transition"
                                        >
                                          Ver 3 opções
                                        </button>

                                        {planFeedback ? (
                                          <span className="text-[12px] text-[#6a6a6a]">{planFeedback}</span>
                                        ) : null}
                                      </div>

                                      {planOptions.length ? (
                                        <div className="mt-4 space-y-2">
                                          {planOptions.map((it) => (
                                            <button
                                              key={it.id}
                                              type="button"
                                              onClick={() => onPickOption(it)}
                                              className="
                                                w-full text-left
                                                rounded-2xl
                                                border border-[#f5d7e5]
                                                bg-white
                                                px-4 py-3
                                                hover:bg-[#fff3f8]
                                                transition
                                              "
                                            >
                                              <div className="text-[13px] font-semibold text-[#2f3a56]">
                                                {it.title}
                                              </div>
                                              <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">
                                                {it.how}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : null}

                                      <RenderEditorialText
                                        text={`Se não servir, troque ou feche por aqui.\n\nSem obrigação.`}
                                        className="mt-4 text-[12px] text-[#6a6a6a] leading-relaxed"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 text-[12px] text-[#6a6a6a]">
                            Regra do Materna: se couber só uma coisa, já conta.
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 1 — CHECK-IN */}
                  <section className="py-6" id="cdm-ritmo">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="heart" size={16} className="text-[#fd2597]" />
                      </div>
                      <div className="min-w-0">
                        <div className="hub-eyebrow text-[#b8236b]">CHECK-IN</div>
                        <div className="hub-title text-[#2f3a56]">Como você está agora?</div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(['leve', 'cansada', 'confusa', 'ok'] as Ritmo[]).map((r) => {
                            const active = ritmo === r
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => onPickRitmo(r)}
                                className={[
                                  'rounded-full px-4 py-2 text-[12px] border transition font-semibold',
                                  active
                                    ? 'bg-[#fd2597] border-[#fd2597] text-white shadow-[0_8px_18px_rgba(253,37,151,0.18)]'
                                    : 'bg-white border-[#f5d7e5] text-[#545454] hover:bg-[#fff3f8]',
                                ].join(' ')}
                              >
                                {r}
                              </button>
                            )
                          })}
                        </div>

                        <RenderEditorialText
                          text="Só um toque para se reconhecer. Nada além disso."
                          className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 2 — SEU DIA */}
                  <section className="py-6" id="cdm-dia">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="list" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="hub-eyebrow text-[#b8236b]">SEU DIA</div>
                        <div className="hub-title text-[#2f3a56]">Do jeito que está</div>

                        <RenderEditorialText
                          text="Uma visão consolidada, sem agenda e sem cobrança."
                          className="hub-subtitle text-[#6a6a6a] leading-relaxed"
                        />

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                              Salvos
                            </div>
                            <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">
                              {stat(daySignals.savedCount)}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                          </div>

                          <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                              Compromissos
                            </div>
                            <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">
                              {stat(daySignals.commitmentsCount)}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                          </div>

                          <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                              Para depois
                            </div>
                            <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">
                              {stat(daySignals.laterCount)}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 3 — ORIENTAÇÃO (NORTE) */}
                  <section className="py-6" id="cdm-norte">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="info" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0">
                        <div className="hub-eyebrow text-[#b8236b]">ORIENTAÇÃO</div>
                        <div className="hub-title text-[#2f3a56]">{guidance.title}</div>

                        <RenderEditorialText
                          text={guidance.text}
                          className="mt-2 text-[13px] md:text-[14px] text-[#545454] leading-relaxed max-w-2xl"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 4 — MICRO CUIDADO */}
                  <section className="pt-6" id="cdm-micro">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="hub-eyebrow text-[#b8236b]">MICRO CUIDADO</div>
                        <div className="hub-title text-[#2f3a56]">Um gesto possível</div>

                        <RenderEditorialText
                          text="Se não couber nada agora, encerrar por aqui já é cuidado."
                          className="hub-subtitle text-[#6a6a6a] leading-relaxed"
                        />

                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                track('cuidar_de_mim.micro_close', { ritmo })
                              } catch {}
                            }}
                            className="
                              inline-flex items-center justify-center
                              rounded-full
                              bg-white
                              border border-[#f5d7e5]
                              text-[#2f3a56]
                              px-5 py-3
                              text-[12px] font-semibold
                              hover:bg-[#fff3f8]
                              transition
                            "
                          >
                            Encerrar por aqui
                          </button>

                          <Link
                            href="/meu-dia"
                            className="
                              inline-flex items-center justify-center
                              rounded-full
                              bg-[#fd2597] hover:opacity-95
                              text-white
                              px-5 py-3
                              text-[12px] font-semibold
                              shadow-[0_10px_26px_rgba(253,37,151,0.22)]
                              transition
                            "
                          >
                            Ver Meu Dia
                          </Link>
                        </div>

                        {euSignal?.showLessLine ? (
                          <div className="mt-3 text-[12px] text-[#6a6a6a]">
                            Hoje pode ser menos. E ainda assim contar.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6">
            <LegalFooter />
          </div>

          <div className="PageSafeBottom" />
        </div>
      </ClientOnly>
    </main>
  )
}
