// app/(tabs)/maternar/meu-filho/Client.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { safeMeuFilhoBloco1Text, clampMeuFilhoBloco1Text } from '@/app/lib/ai/validators/bloco1'
import {
  hasPerceptiveRepetition,
  recordAntiRepeat,
  makeTitleSignature,
  makeThemeSignature,
  resetAntiRepeatIfDayChanged,
} from '@/app/lib/ai/antiRepetitionLocal'

import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

import { addTaskToMyDay, listMyDayTasks, MY_DAY_SOURCES, type MyDayTaskItem } from '@/app/lib/myDayTasks.client'

import { markJourneyFamilyDone, getJourneySnapshot } from '@/app/lib/journey.client'
import { getActiveChildOrNull, getProfileSnapshot, type ProfileSource } from '@/app/lib/profile.client'

import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'brincadeiras' | 'desenvolvimento' | 'rotina' | 'conexao'
type TimeMode = '5' | '10' | '15'
type AgeBand = '0-2' | '3-4' | '5-6' | '6+'

type PlanItem = {
  title: string
  how: string
  time: TimeMode
  tag: string
}

type Kit = {
  id: string
  title: string
  subtitle: string
  time: TimeMode
  plan: { a: PlanItem; b: PlanItem; c: PlanItem }
  development: { label: string; note: string }
  routine: { label: string; note: string }
  connection: { label: string; note: string }
}

/**
 * P34.10 — Tema (decisão mínima) para Bloco 3
 */
type RotinaTema = 'transicao' | 'banho' | 'jantar' | 'sono' | 'manha'
type ConexaoTema = 'checkin' | 'carinho' | 'conversa' | 'calmaria'

const ROTINA_TEMAS: { id: RotinaTema; label: string }[] = [
  { id: 'transicao', label: 'Transição' },
  { id: 'banho', label: 'Banho' },
  { id: 'jantar', label: 'Jantar' },
  { id: 'sono', label: 'Sono' },
  { id: 'manha', label: 'Manhã' },
]

const CONEXAO_TEMAS: { id: ConexaoTema; label: string }[] = [
  { id: 'checkin', label: 'Check-in' },
  { id: 'carinho', label: 'Carinho' },
  { id: 'conversa', label: 'Conversa' },
  { id: 'calmaria', label: 'Calmaria' },
]

/**
 * Filtros — Brincadeiras (Bloco 2)
 */
type PlayLocation = 'casa' | 'ar_livre' | 'deslocamento'
type SkillId = 'motor' | 'linguagem' | 'emocional' | 'cognitivo' | 'social' | 'autonomia'

const PLAY_LOCATIONS: { id: PlayLocation; label: string; hint: string }[] = [
  { id: 'casa', label: 'Em casa', hint: 'Sem bagunça grande' },
  { id: 'ar_livre', label: 'Ao ar livre', hint: 'Parque, quintal, rua' },
  { id: 'deslocamento', label: 'Em deslocamento', hint: 'Fila, carro, espera' },
]

const SKILLS: { id: SkillId; label: string }[] = [
  { id: 'motor', label: 'Motor' },
  { id: 'linguagem', label: 'Linguagem' },
  { id: 'emocional', label: 'Emoções' },
  { id: 'cognitivo', label: 'Cognitivo' },
  { id: 'social', label: 'Social' },
  { id: 'autonomia', label: 'Autonomia' },
]

/**
 * Filtros — Fase (Bloco 4)
 */
type FaseFoco = 'atencao' | 'emocao' | 'autonomia' | 'social' | 'linguagem'
const FASE_FOCOS: { id: FaseFoco; label: string }[] = [
  { id: 'atencao', label: 'Atenção' },
  { id: 'emocao', label: 'Emoções' },
  { id: 'autonomia', label: 'Autonomia' },
  { id: 'social', label: 'Social' },
  { id: 'linguagem', label: 'Linguagem' },
]

const LS_PREFIX = 'm360:'

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
    window.localStorage.setItem(key, value) // compat legado
  } catch {}
}

function stepIndex(s: Step) {
  return s === 'brincadeiras' ? 1 : s === 'desenvolvimento' ? 2 : s === 'rotina' ? 3 : 4
}

function timeLabel(t: TimeMode) {
  if (t === '5') return '5 min'
  if (t === '10') return '10 min'
  return '15 min'
}

function timeTitle(t: TimeMode) {
  if (t === '5') return 'Ligação rápida'
  if (t === '10') return 'Presença prática'
  return 'Momento completo'
}

function timeHint(t: TimeMode) {
  if (t === '5') return 'Para quando você só precisa “conectar e seguir”.'
  if (t === '10') return 'Para quando dá para brincar sem complicar.'
  return 'Para quando você quer fechar o dia com presença de verdade.'
}

/**
 * Preferências “silenciosas” do hub Meu Filho.
 */
const HUB_PREF = {
  time: 'maternar/meu-filho/pref/time',
  ageBand: 'maternar/meu-filho/pref/ageBand',
  preferredChildId: 'maternar/meu-filho/pref/childId',
}

function ageBandFromMonths(ageMonths: number | null | undefined): AgeBand | null {
  if (typeof ageMonths !== 'number' || !Number.isFinite(ageMonths)) return null
  const m = Math.max(0, Math.floor(ageMonths))
  if (m <= 35) return '0-2'
  if (m <= 59) return '3-4'
  if (m <= 83) return '5-6'
  return '6+'
}

function normalizeAgeBand(v: unknown): AgeBand | null {
  const s = String(v ?? '').trim()
  if (s === '0-2' || s === '3-4' || s === '5-6' || s === '6+') return s
  return null
}

function normalizeTimeMode(v: unknown): TimeMode | null {
  const s = String(v ?? '').trim()
  if (s === '5' || s === '10' || s === '15') return s
  return null
}

function normalizePlayLocation(v: unknown): PlayLocation | null {
  const s = String(v ?? '').trim()
  if (s === 'casa' || s === 'ar_livre' || s === 'deslocamento') return s
  return null
}

function normalizeSkills(v: unknown): SkillId[] {
  if (!Array.isArray(v)) return []
  const out: SkillId[] = []
  v.forEach((x) => {
    const s = String(x ?? '').trim()
    if (s === 'motor' || s === 'linguagem' || s === 'emocional' || s === 'cognitivo' || s === 'social' || s === 'autonomia') {
      out.push(s)
    }
  })
  return out
}

function normalizeFaseFoco(v: unknown): FaseFoco | null {
  const s = String(v ?? '').trim()
  if (s === 'atencao' || s === 'emocao' || s === 'autonomia' || s === 'social' || s === 'linguagem') return s
  return null
}

const HUB_PREF_FILTERS = {
  playLocation: 'maternar/meu-filho/pref/playLocation',
  skills: 'maternar/meu-filho/pref/skills',
  faseFoco: 'maternar/meu-filho/pref/faseFoco',
}

function inferContext(): {
  time: TimeMode
  age: AgeBand
  childLabel?: string
  playLocation: PlayLocation
  skills: SkillId[]
  faseFoco: FaseFoco
} {
  const prefTime = normalizeTimeMode(safeGetLS(HUB_PREF.time))
  const prefAgeBand = normalizeAgeBand(safeGetLS(HUB_PREF.ageBand))
  const prefChildId = safeGetLS(HUB_PREF.preferredChildId)

  const prefLocation = normalizePlayLocation(safeGetLS(HUB_PREF_FILTERS.playLocation))
  const prefSkills = normalizeSkills(
    (() => {
      try {
        const raw = safeGetLS(HUB_PREF_FILTERS.skills)
        if (!raw) return []
        return JSON.parse(raw)
      } catch {
        return []
      }
    })(),
  )
  const prefFaseFoco = normalizeFaseFoco(safeGetLS(HUB_PREF_FILTERS.faseFoco))

  const child = getActiveChildOrNull(prefChildId)
  const derivedAgeBand = ageBandFromMonths(child?.ageMonths ?? null)

  const legacyTime = normalizeTimeMode(safeGetLS('eu360_time_with_child'))
  const legacyAgeBand = normalizeAgeBand(safeGetLS('eu360_child_age_band'))

  const time: TimeMode = prefTime ?? legacyTime ?? '15'
  const age: AgeBand = prefAgeBand ?? derivedAgeBand ?? legacyAgeBand ?? '3-4'

  return {
    time,
    age,
    childLabel: child?.label,
    playLocation: prefLocation ?? 'casa',
    skills: prefSkills.length ? prefSkills : (['emocional'] as SkillId[]),
    faseFoco: prefFaseFoco ?? 'emocao',
  }
}

/* =========================
   Helpers — variação / anti-cache
========================= */

function newNonce() {
  try {
    const c = globalThis.crypto
    if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  } catch {}
  return `n_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

/* =========================
   P34.11.2 — Anti-repetição local (silencioso)
========================= */

const HUB_AI = 'maternar/meu-filho' as const

async function withAntiRepeatText(args: {
  themeSignature: string
  run: (nonce: string) => Promise<string | null>
  fallback: () => string
  maxTries?: number
}) {
  resetAntiRepeatIfDayChanged()

  const tries = Math.max(1, Math.min(3, args.maxTries ?? 2))
  for (let i = 0; i < tries; i++) {
    const nonce = newNonce()
    const text = await args.run(nonce)

    if (text) {
      const titleSig = makeTitleSignature(text.slice(0, 60))
      const themeSig = makeThemeSignature(args.themeSignature)

      const repeated = hasPerceptiveRepetition({
        hub: HUB_AI,
        title_signature: titleSig,
        theme_signature: themeSig,
      })

      if (!repeated) {
        recordAntiRepeat({ hub: HUB_AI, title_signature: titleSig, theme_signature: themeSig, variation_axis: nonce })
        return { text, source: 'ai' as const }
      }

      // repetiu: tenta de novo silenciosamente (novo nonce)
      continue
    }
  }

  const fb = args.fallback()
  try {
    const titleSig = makeTitleSignature(fb.slice(0, 60))
    const themeSig = makeThemeSignature(args.themeSignature)
    recordAntiRepeat({ hub: HUB_AI, title_signature: titleSig, theme_signature: themeSig, variation_axis: 'fallback' })
  } catch {}

  return { text: fb, source: 'fallback' as const }
}

type Bloco2Items = { a: PlanItem; b: PlanItem; c: PlanItem }

async function withAntiRepeatPack(args: {
  themeSignature: string
  run: (nonce: string) => Promise<Bloco2Items | null>
  fallback: () => Bloco2Items
  maxTries?: number
}) {
  resetAntiRepeatIfDayChanged()

  const tries = Math.max(1, Math.min(3, args.maxTries ?? 2))
  for (let i = 0; i < tries; i++) {
    const nonce = newNonce()
    const items = await args.run(nonce)

    if (items) {
      const titleComposite = `${items.a.title} | ${items.b.title} | ${items.c.title}`
      const titleSig = makeTitleSignature(titleComposite)
      const themeSig = makeThemeSignature(args.themeSignature)

      const repeated = hasPerceptiveRepetition({
        hub: HUB_AI,
        title_signature: titleSig,
        theme_signature: themeSig,
      })

      if (!repeated) {
        recordAntiRepeat({ hub: HUB_AI, title_signature: titleSig, theme_signature: themeSig, variation_axis: nonce })
        return { items, source: 'ai' as const }
      }

      continue
    }
  }

  const fb = args.fallback()
  try {
    const titleComposite = `${fb.a.title} | ${fb.b.title} | ${fb.c.title}`
    recordAntiRepeat({
      hub: HUB_AI,
      title_signature: makeTitleSignature(titleComposite),
      theme_signature: makeThemeSignature(args.themeSignature),
      variation_axis: 'fallback',
    })
  } catch {}

  return { items: fb, source: 'fallback' as const }
}
/* =========================
   P26 — Guardrails + Jornada
========================= */

type TaskWithStatus = MyDayTaskItem & { status?: 'active' | 'snoozed' | 'done'; done?: boolean; source?: string }

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  const tt = t as TaskWithStatus
  if (tt.status === 'active' || tt.status === 'snoozed' || tt.status === 'done') return tt.status
  if (tt.done === true) return 'done'
  return 'active'
}

function countActiveFamilyFromMeuFilhoToday(tasks: MyDayTaskItem[]) {
  return tasks.filter((t) => {
    const tt = t as TaskWithStatus
    const isFamily = t.origin === 'family'
    const isFromMeuFilho = tt.source === MY_DAY_SOURCES.MATERNAR_MEU_FILHO
    const isActive = statusOf(t) === 'active'
    return isFamily && isFromMeuFilho && isActive
  }).length
}

/* =========================
   BLOCO 1 — CANÔNICO (fallback silencioso)
========================= */

const BLOCO1_FALLBACK: Record<AgeBand, Record<TimeMode, string>> = {
  '0-2': {
    '5':
      'Sente no chão com ele e faça 3 gestos simples para ele copiar. Repita cada um duas vezes e comemore cada acerto com um sorriso. No fim, abrace e diga “agora vamos guardar”.',
    '10':
      'Faça um caminho curto com almofadas e atravessem juntos três vezes. A cada volta, nomeie um movimento (“pula”, “passa”, “senta”). No final, guardem uma almofada por vez lado a lado.',
    '15':
      'Escolha 5 itens seguros da casa e explore um por vez com ele por alguns segundos. Repita dois itens que ele mais gostar e mantenha o ritmo curto. No final, guardem tudo juntos e feche com um abraço.',
  },
  '3-4': {
    '5':
      'Escolham três objetos da casa para procurar juntos. Cada achado vira uma pequena comemoração com palma e sorriso. No final, guardem tudo lado a lado.',
    '10':
      'Crie uma “pista” simples no chão e ele percorre duas rodadas com você narrando. Na última volta, ele escolhe um movimento para você copiar. No final, vocês guardam e fecham com um abraço curto.',
    '15':
      'Faça uma “missão” com três tarefas rápidas: buscar, entregar e organizar um cantinho. Você narra como se fosse uma aventura e ele executa. No final, guardem juntos e diga “missão cumprida”.',
  },
  '5-6': {
    '5':
      'Faça duas perguntas curtas sobre o dia e escute sem corrigir. Em seguida, escolham um desafio rápido de 1 minuto de movimento. No final, feche com um abraço e um “obrigada por me contar”.',
    '10':
      'Monte um circuito com três movimentos e façam duas rodadas cronometradas. Na segunda, ele escolhe a ordem e você segue. No final, guardem um item juntos e encerre com um elogio do esforço.',
    '15':
      'Brinquem 10 minutos de algo rápido que ele escolha e mantenha o ritmo sem pausar. Depois, ele ajuda 5 minutos em uma tarefa pequena da casa. No final, agradeça e feche com um abraço curto.',
  },
  '6+': {
    '5':
      'Pergunte de 0 a 10 como foi o dia e escute a resposta inteira. Façam 2 minutos de alongamento e 2 minutos de respiração juntos. No final, combinem uma coisa simples para agora e siga.',
    '10':
      'Faça duas perguntas objetivas e deixe ele escolher uma atividade rápida de 6 minutos. Depois, organizem um cantinho por 3 minutos com música. No final, feche com um “valeu por fazer junto”.',
    '15':
      'Deixe ele escolher 10 minutos de algo simples para vocês fazerem lado a lado. Em seguida, façam 5 minutos de organização mínima do espaço. No final, reconheça o esforço e encerre sem estender.',
  },
}

type Bloco1State = { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string; source: 'ai' | 'fallback' }

async function fetchBloco1Plan(args: { tempoDisponivel: number; nonce: string }): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/rotina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        feature: 'quick-ideas',
        origin: 'maternar/meu-filho',
        tempoDisponivel: args.tempoDisponivel,
        comQuem: 'eu-e-meu-filho',
        tipoIdeia: 'meu-filho-bloco-1',
        requestId: args.nonce,
        nonce: args.nonce,
      }),
    })

    if (!res.ok) return null
    const data = (await res.json().catch(() => null)) as { suggestions?: { description?: string }[] } | null
    const desc = data?.suggestions?.[0]?.description
    const cleaned = safeMeuFilhoBloco1Text(desc)
    if (!cleaned) return null
    return cleaned
  } catch {
    return null
  }
}

/* =========================
   BLOCO 2 — IA + FALLBACK (Exploração Guiada)
========================= */

type Bloco2State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: Bloco2Items; source: 'ai' | 'fallback' }

function stripEmojiAndBullets(s: string) {
  const text = String(s ?? '')
  const noBullets = text
    .replace(/(^|\n)\s*[•●▪▫◦]\s+/g, '$1')
    .replace(/(^|\n)\s*[-–—]\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  return noBullets.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim()
}

function clampText(s: string, max: number) {
  const t = stripEmojiAndBullets(String(s ?? '').trim())
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + '…'
}

function safeBloco2Title(raw: unknown): string | null {
  const t = clampText(String(raw ?? ''), 60)
  if (!t) return null
  if (t.toLowerCase() === 'brincadeira' || t.toLowerCase() === 'atividade') return null
  return t
}

function safeBloco2How(raw: unknown): string | null {
  const t = clampText(String(raw ?? ''), 320)
  if (!t) return null
  const low = t.toLowerCase()
  if (low.startsWith('que tal') || low.startsWith('uma boa ideia')) return null

  const hasStepsCue =
    low.includes('faça') ||
    low.includes('combine') ||
    low.includes('depois') ||
    low.includes('no final') ||
    low.includes('em seguida') ||
    low.includes('por fim') ||
    low.includes('primeiro') ||
    low.includes('então')

  if (!hasStepsCue) return null
  return t
}

type SuggestionPack = { title: string; description: string }
function pick3Suggestions(data: unknown): SuggestionPack[] | null {
  const d = data as { suggestions?: unknown }
  const arr = Array.isArray(d?.suggestions) ? (d?.suggestions as any[]) : null
  if (!arr || arr.length < 3) return null

  const pack = [arr[0], arr[1], arr[2]].map((s) => ({
    title: String(s?.title ?? '').trim(),
    description: String(s?.description ?? '').trim(),
  }))
  if (pack.some((p) => !p.title || !p.description)) return null
  return pack
}

async function fetchBloco2Cards(args: {
  tempoDisponivel: number
  age: AgeBand
  playLocation: PlayLocation
  skills: SkillId[]
  nonce: string
}): Promise<Bloco2Items | null> {
  try {
    const res = await fetch('/api/ai/rotina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        feature: 'quick-ideas',
        origin: 'maternar/meu-filho',
        tempoDisponivel: args.tempoDisponivel,
        comQuem: 'eu-e-meu-filho',
        tipoIdeia: 'meu-filho-bloco-2',
        ageBand: args.age,
        contexto: 'exploracao',
        local: args.playLocation,
        habilidades: args.skills,
        requestId: args.nonce,
        nonce: args.nonce,
        variation: args.nonce,
      }),
    })

    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    const picked = pick3Suggestions(data)
    if (!picked) return null

    const mk = (i: { title: string; description: string }): PlanItem | null => {
      const title = safeBloco2Title(i.title)
      const how = safeBloco2How(i.description)
      if (!title || !how) return null
      return { title, how, time: String(args.tempoDisponivel) as TimeMode, tag: 'curado' }
    }

    const a = mk(picked[0])
    const b = mk(picked[1])
    const c = mk(picked[2])
    if (!a || !b || !c) return null

    return { a, b, c }
  } catch {
    return null
  }
}
/* =========================
   BLOCO 3 — ROTINAS / CONEXÃO
========================= */

// Payload-safe (sem acentos) para evitar mismatch no backend/schema
type MomentoDoDia = 'manha' | 'tarde' | 'noite' | 'transicao'
type Bloco3Type = 'rotina' | 'conexao'

type Bloco3State =
  | { status: 'idle' }
  | { status: 'loading'; kind: Bloco3Type }
  | { status: 'done'; kind: Bloco3Type; text: string; source: 'ai' | 'fallback'; momento: MomentoDoDia }

function clampBloco3Text(raw: unknown): string | null {
  const t = clampText(String(raw ?? ''), 260)
  if (!t) return null
  const low = t.toLowerCase()

  const banned = ['todo dia', 'todos os dias', 'sempre', 'nunca', 'crie o hábito', 'hábito', 'disciplina', 'rotina ideal', 'o mais importante é']
  if (banned.some((b) => low.includes(b))) return null

  if (t.includes('\n') || t.includes('•') || t.includes('- ')) return null

  const sentences = t
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentences.length > 4) return null

  return t
}

const BLOCO3_FALLBACK: Record<Bloco3Type, Record<AgeBand, string>> = {
  rotina: {
    '0-2': 'Use o mesmo aviso curto antes de trocar de atividade. Diga “agora vamos guardar” e faça junto por 30 segundos. Isso já reduz a resistência.',
    '3-4': 'Antes de mudar de atividade, faça um “sinal de troca” sempre igual. Pode ser um timer curto ou uma frase fixa. A criança entende a transição sem discussão.',
    '5-6': 'Escolha um encerramento simples para a brincadeira: guardar 1 item juntos e pronto. Isso evita esticar e ajuda a passar para a próxima parte do dia.',
    '6+': 'Feche a atividade com um combinado objetivo: “agora é X, depois Y”. Sem explicar muito. A previsibilidade curta reduz atrito na transição.',
  },
  conexao: {
    '0-2': 'No final, faça 10 segundos de olho no olho e um abraço curto. Sem conversa. Só presença antes de seguir.',
    '3-4': 'Feche com um gesto que se repete: toque no ombro, abraço curto e “valeu por brincar”. Não precisa durar. Só marca o fim com carinho.',
    '5-6': 'Use uma frase curta e específica no final: “eu gostei de brincar com você”. Depois siga para o próximo passo do dia. Presença curta já conta.',
    '6+': 'Faça um check-in rápido: uma pergunta e escuta sem corrigir. Depois encerre com “valeu por fazer junto”. Conexão curta, sem estender.',
  },
}

async function fetchBloco3Suggestion(args: {
  faixa_etaria: AgeBand
  momento_do_dia: MomentoDoDia
  tipo_experiencia: Bloco3Type
  contexto: 'continuidade'
  tema: RotinaTema | ConexaoTema
  nonce: string
}): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/rotina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        feature: 'micro-ritmos',
        origin: 'maternar/meu-filho',
        tipoIdeia: 'meu-filho-bloco-3',
        idade: args.faixa_etaria,
        faixa_etaria: args.faixa_etaria,
        momento_do_dia: args.momento_do_dia,
        tipo_experiencia: args.tipo_experiencia,
        contexto: args.contexto,
        tema: args.tema,
        requestId: args.nonce,
        nonce: args.nonce,
        variation: args.nonce,
      }),
    })

    if (!res.ok) return null
    const data = (await res.json().catch(() => null)) as any

    const candidate =
      data?.suggestion ??
      data?.text ??
      data?.output ??
      data?.suggestions?.[0]?.description ??
      data?.suggestions?.[0]?.text ??
      null

    const cleaned = clampBloco3Text(candidate)
    if (!cleaned) return null
    return cleaned
  } catch {
    return null
  }
}

/* =========================
   BLOCO 4 — “FASES / CONTEXTO”
========================= */

type MomentoDesenvolvimento = 'exploracao' | 'afirmacao' | 'imitacao' | 'autonomia'

type Bloco4State = { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string; source: 'ai' | 'fallback'; momento?: MomentoDesenvolvimento }

function inferMomentoDesenvolvimento(ageBand: AgeBand): MomentoDesenvolvimento | undefined {
  if (ageBand === '0-2') return 'exploracao'
  if (ageBand === '3-4') return 'imitacao'
  if (ageBand === '5-6') return 'afirmacao'
  if (ageBand === '6+') return 'autonomia'
  return undefined
}

function clampBloco4Text(raw: unknown): string | null {
  const t = clampText(String(raw ?? ''), 160)
  if (!t) return null
  const low = t.toLowerCase()

  const banned = [
    'é esperado',
    'já deveria',
    'o ideal',
    'normalmente já',
    'crianças dessa idade',
    'precisa',
    'precisam',
    'deve',
    'deveria',
    'tem que',
    'têm que',
    'diagnóstico',
    'atraso',
    'anormal',
    'normal',
  ]
  if (banned.some((b) => low.includes(b))) return null

  if (t.includes('\n') || t.includes('•') || t.includes('- ')) return null

  const sentences = t
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentences.length !== 1) return null

  return t
}

const BLOCO4_FALLBACK: Record<AgeBand, string> = {
  '0-2': 'Nesta fase, repetir gestos simples e curtos costuma manter o interesse sem esticar demais.',
  '3-4': 'Nesta fase, faz de conta curto com começo e fim claro costuma reduzir atrito e prender a atenção.',
  '5-6': 'Nesta fase, dar escolha entre duas opções simples costuma ajudar a colaborar sem disputa.',
  '6+': 'Nesta fase, combinados curtos e respeito à autonomia costumam diminuir resistência nas transições.',
}

async function fetchBloco4Suggestion(args: {
  faixa_etaria: AgeBand
  momento_desenvolvimento?: MomentoDesenvolvimento
  contexto: 'fase'
  foco: FaseFoco
  nonce: string
}): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/rotina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        feature: 'fase-contexto',
        origin: 'maternar/meu-filho',
        tipoIdeia: 'meu-filho-bloco-4',
        idade: args.faixa_etaria,
        faixa_etaria: args.faixa_etaria,
        momento_desenvolvimento: args.momento_desenvolvimento,
        contexto: args.contexto,
        foco: args.foco,
        requestId: args.nonce,
        nonce: args.nonce,
        variation: args.nonce,
      }),
    })

    if (!res.ok) return null
    const data = (await res.json().catch(() => null)) as any

    const candidate =
      data?.text ??
      data?.suggestion ??
      data?.output ??
      data?.phrase ??
      data?.suggestions?.[0]?.text ??
      data?.suggestions?.[0]?.description ??
      null

    const cleaned = clampBloco4Text(candidate)
    if (!cleaned) return null
    return cleaned
  } catch {
    return null
  }
}

/* =========================
   KITS (fallback local)
========================= */
const KITS: Record<AgeBand, Record<TimeMode, Kit>> = {
  '0-2': {
    '5': {
      id: 'k-0-2-5',
      title: 'Conexão em 5 min (0–2)',
      subtitle: 'Fallback local',
      time: '5',
      plan: {
        a: { title: 'Conexão breve', how: 'Fique perto, observe e responda aos gestos da criança.', time: '5', tag: 'fallback' },
        b: { title: 'Explorar juntos', how: 'Mostre um objeto simples e acompanhe a curiosidade.', time: '5', tag: 'fallback' },
        c: { title: 'Presença calma', how: 'Sente-se ao lado e compartilhe o momento.', time: '5', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Exploração sensorial e repetição curta ajudam.' },
      routine: { label: 'Rotina', note: 'Avise a transição com uma frase curta antes de mudar.' },
      connection: { label: 'Conexão', note: 'Olho no olho por alguns segundos já conta.' },
    },
    '10': {
      id: 'k-0-2-10',
      title: 'Presença prática em 10 min (0–2)',
      subtitle: 'Fallback local',
      time: '10',
      plan: {
        a: { title: 'Exploração guiada', how: 'Incentive pequenos movimentos e sons.', time: '10', tag: 'fallback' },
        b: { title: 'Interação afetiva', how: 'Converse e reaja às expressões da criança.', time: '10', tag: 'fallback' },
        c: { title: 'Descoberta sensorial', how: 'Use algo do ambiente para explorar juntos.', time: '10', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Ritmo curto e previsível mantém o interesse.' },
      routine: { label: 'Rotina', note: 'Feche com “agora vamos guardar” e guarde 1 item juntos.' },
      connection: { label: 'Conexão', note: 'Abraço curto e respiração junto por 3 ciclos.' },
    },
    '15': {
      id: 'k-0-2-15',
      title: 'Momento completo em 15 min (0–2)',
      subtitle: 'Fallback local',
      time: '15',
      plan: {
        a: { title: 'Tempo juntos', how: 'Permaneça disponível e atento.', time: '15', tag: 'fallback' },
        b: { title: 'Brincar simples', how: 'Repita gestos e sons com a criança.', time: '15', tag: 'fallback' },
        c: { title: 'Acolhimento', how: 'Ofereça colo e contato visual.', time: '15', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Repetição e previsibilidade reduzem irritação.' },
      routine: { label: 'Rotina', note: 'Use um aviso curto antes de cada troca de atividade.' },
      connection: { label: 'Conexão', note: 'Presença silenciosa e sorriso encerram bem.' },
    },
  },

  '3-4': {
    '5': {
      id: 'k-3-4-5',
      title: 'Conexão em 5 min (3–4)',
      subtitle: 'Fallback local',
      time: '5',
      plan: {
        a: { title: 'Missão rápida', how: 'Convide a criança para uma tarefa simples juntos.', time: '5', tag: 'fallback' },
        b: { title: 'Observação', how: 'Observe algo do ambiente e conversem.', time: '5', tag: 'fallback' },
        c: { title: 'Movimento leve', how: 'Faça um pequeno movimento corporal junto.', time: '5', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Faz de conta curto com começo e fim ajuda.' },
      routine: { label: 'Rotina', note: 'Transição fica melhor com aviso + contagem.' },
      connection: { label: 'Conexão', note: 'Uma frase de reconhecimento encerra bem.' },
    },
    '10': {
      id: 'k-3-4-10',
      title: 'Presença prática em 10 min (3–4)',
      subtitle: 'Fallback local',
      time: '10',
      plan: {
        a: { title: 'Brincar dirigido', how: 'Proponha uma brincadeira curta.', time: '10', tag: 'fallback' },
        b: { title: 'Exploração ativa', how: 'Use objetos comuns para criar algo.', time: '10', tag: 'fallback' },
        c: { title: 'Conversa breve', how: 'Pergunte e escute com atenção.', time: '10', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Escolhas simples (2 opções) reduzem disputa.' },
      routine: { label: 'Rotina', note: 'Timer curto ajuda a encerrar sem briga.' },
      connection: { label: 'Conexão', note: 'Toque no ombro + olhar nos olhos por 5s.' },
    },
    '15': {
      id: 'k-3-4-15',
      title: 'Momento completo em 15 min (3–4)',
      subtitle: 'Fallback local',
      time: '15',
      plan: {
        a: { title: 'Atividade conjunta', how: 'Realizem algo simples do começo ao fim.', time: '15', tag: 'fallback' },
        b: { title: 'Criar juntos', how: 'Inventem algo rápido.', time: '15', tag: 'fallback' },
        c: { title: 'Conexão tranquila', how: 'Fique presente e disponível.', time: '15', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Ritual curto de encerramento ajuda transições.' },
      routine: { label: 'Rotina', note: 'Feche brincadeira guardando 1 item juntos.' },
      connection: { label: 'Conexão', note: '“Obrigada por brincar comigo” + sorriso.' },
    },
  },

  '5-6': {
    '5': {
      id: 'k-5-6-5',
      title: 'Conexão em 5 min (5–6)',
      subtitle: 'Fallback local',
      time: '5',
      plan: {
        a: { title: 'Desafio curto', how: 'Proponha um pequeno desafio.', time: '5', tag: 'fallback' },
        b: { title: 'Organização leve', how: 'Arrumem algo juntos.', time: '5', tag: 'fallback' },
        c: { title: 'Troca rápida', how: 'Conversem brevemente.', time: '5', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Reconhecer esforço melhora colaboração.' },
      routine: { label: 'Rotina', note: 'Combinado curto “agora X, depois Y” ajuda.' },
      connection: { label: 'Conexão', note: 'Diga algo específico que você percebeu.' },
    },
    '10': {
      id: 'k-5-6-10',
      title: 'Presença prática em 10 min (5–6)',
      subtitle: 'Fallback local',
      time: '10',
      plan: {
        a: { title: 'Jogo simples', how: 'Inicie um jogo rápido.', time: '10', tag: 'fallback' },
        b: { title: 'Criação livre', how: 'Desenhem ou montem algo.', time: '10', tag: 'fallback' },
        c: { title: 'Exploração guiada', how: 'Descubram algo novo.', time: '10', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Dar escolha entre 2 opções reduz atrito.' },
      routine: { label: 'Rotina', note: 'Função simples (“você cuida de X”) facilita transição.' },
      connection: { label: 'Conexão', note: '5 minutos 1:1 sem tela já muda o clima.' },
    },
    '15': {
      id: 'k-5-6-15',
      title: 'Momento completo em 15 min (5–6)',
      subtitle: 'Fallback local',
      time: '15',
      plan: {
        a: { title: 'Projeto curto', how: 'Planejem e executem algo simples.', time: '15', tag: 'fallback' },
        b: { title: 'Brincadeira estruturada', how: 'Siga regras simples.', time: '15', tag: 'fallback' },
        c: { title: 'Momento de vínculo', how: 'Conversem com calma.', time: '15', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Combinar começo e fim reduz resistência.' },
      routine: { label: 'Rotina', note: 'Timer visível ajuda a encerrar sem disputa.' },
      connection: { label: 'Conexão', note: 'Reconheça: “eu vi que foi difícil e você tentou”.' },
    },
  },

  '6+': {
    '5': {
      id: 'k-6p-5',
      title: 'Conexão em 5 min (6+)',
      subtitle: 'Fallback local',
      time: '5',
      plan: {
        a: { title: 'Check-in rápido', how: 'Pergunte “de 0 a 10, como foi seu dia?” e escute.', time: '5', tag: 'fallback' },
        b: { title: 'Descompressão', how: '2 min alongar + 2 min respirar + 1 min combinado.', time: '5', tag: 'fallback' },
        c: { title: 'Ajuda prática', how: 'Ele ajuda em 1 coisa; você agradece e reconhece.', time: '5', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Respeito e autonomia aumentam cooperação.' },
      routine: { label: 'Rotina', note: 'Combinar “o que vem agora” evita atrito.' },
      connection: { label: 'Conexão', note: 'Escuta curta sem corrigir fecha bem.' },
    },
    '10': {
      id: 'k-6p-10',
      title: 'Presença prática em 10 min (6+)',
      subtitle: 'Fallback local',
      time: '10',
      plan: {
        a: { title: 'Conversa guiada', how: '2 perguntas e uma escuta direta.', time: '10', tag: 'fallback' },
        b: { title: 'Atividade rápida', how: 'Ele escolhe algo curto para fazer lado a lado.', time: '10', tag: 'fallback' },
        c: { title: 'Organizar junto', how: 'Organizem um cantinho por 5–8 minutos.', time: '10', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Escolhas claras reduzem resistência.' },
      routine: { label: 'Rotina', note: 'Evite explicação longa; use combinado objetivo.' },
      connection: { label: 'Conexão', note: 'Pergunte: “quer ajuda ou só que eu te ouça?”' },
    },
    '15': {
      id: 'k-6p-15',
      title: 'Momento completo em 15 min (6+)',
      subtitle: 'Fallback local',
      time: '15',
      plan: {
        a: { title: '10 min + 5 min', how: '10 min de escolha dele + 5 min de organização simples.', time: '15', tag: 'fallback' },
        b: { title: 'Arrumar com música', how: 'Arrumem por 10 min com música; feche com conversa breve.', time: '15', tag: 'fallback' },
        c: { title: 'Combinados do dia', how: 'Atividade curta + 3 min de combinados objetivos.', time: '15', tag: 'fallback' },
      },
      development: { label: 'Nesta fase', note: 'Previsibilidade curta e respeito ajudam transições.' },
      routine: { label: 'Rotina', note: 'Feche sempre com “agora X, depois Y”.' },
      connection: { label: 'Conexão', note: 'Reconheça o esforço, sem alongar.' },
    },
  },
}

/* =========================
   P34.10 — Legibilidade Mobile (quebra editorial)
========================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []
  const text = String(raw).trim()
  if (!text) return []

  const markers = ['No final,', 'No fim,', 'Depois,', 'Em seguida,', 'Por fim,']
  let working = text

  markers.forEach((m) => {
    working = working.replace(new RegExp(`\\s*${escapeRegExp(m)}`, 'g'), `\n\n${m}`)
  })

  const parts = working
    .split(/\n\n|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length === 0) return [text]
  return parts.slice(0, 4)
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function RenderEditorialText({
  text,
  wrapClassName,
  pClassName,
}: {
  text: string | null | undefined
  wrapClassName?: string
  pClassName: string
}) {
  const parts = splitEditorialText(text)
  if (parts.length === 0) return null
  return (
    <div className={['space-y-2', wrapClassName ?? ''].join(' ').trim()}>
      {parts.map((p, i) => (
        <p key={i} className={pClassName}>
          {p}
        </p>
      ))}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[12px] transition select-none',
        active ? 'bg-white border-white text-[#2f3a56]' : 'bg-white/20 border-white/35 text-white hover:bg-white/30',
      ].join(' ')}
    >
      <span className="leading-none">{label}</span>
    </button>
  )
}

function SubChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-[12px] transition',
        active ? 'bg-[#fd2597] border-[#fd2597] text-white' : 'bg-white border-[#ffd1e6] text-[#2f3a56] hover:bg-[#fff3f8]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export default function MeuFilhoClient() {
  const [step, setStep] = useState<Step>('brincadeiras')
  const [time, setTime] = useState<TimeMode>('15')
  const [age, setAge] = useState<AgeBand>('3-4')
  const [chosen, setChosen] = useState<'a' | 'b' | 'c'>('a')

  const [childLabel, setChildLabel] = useState<string | undefined>(undefined)
  const [familyDoneToday, setFamilyDoneToday] = useState(false)

  const [playLocation, setPlayLocation] = useState<PlayLocation>('casa')
  const [skills, setSkills] = useState<SkillId[]>(['emocional'])
  const [faseFoco, setFaseFoco] = useState<FaseFoco>('emocao')

  const [rotinaTema, setRotinaTema] = useState<RotinaTema | null>(null)
  const [conexaoTema, setConexaoTema] = useState<ConexaoTema | null>(null)

  const [bloco1, setBloco1] = useState<Bloco1State>({ status: 'idle' })
  const [bloco2, setBloco2] = useState<Bloco2State>({ status: 'idle' })
  const [bloco3, setBloco3] = useState<Bloco3State>({ status: 'idle' })
  const [bloco4, setBloco4] = useState<Bloco4State>({ status: 'idle' })

  const kit = useMemo(() => KITS[age][time], [age, time])

  const effectivePlan = bloco2.status === 'done' ? bloco2.items : kit.plan
  const selected = effectivePlan[chosen]

  function saveSelectedToMyDay(title: string) {
    const today = listMyDayTasks()
    const activeCount = countActiveFamilyFromMeuFilhoToday(today)

    if (activeCount >= 3) {
      toast.info('Você já salvou 3 ações do Meu Filho hoje.')
      return
    }

    const res = addTaskToMyDay({
      title,
      origin: 'family',
      source: MY_DAY_SOURCES.MATERNAR_MEU_FILHO,
    })

    if (res.created) toast.success('Salvo no Meu Dia')
    else toast.info('Já estava no Meu Dia')
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        overflow-x-hidden
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <section className="px-4 pt-6 space-y-6">

          {/* HEADER */}
          <header className="text-white space-y-1">
            <h1 className="text-[22px] font-semibold leading-tight">
              Meu Filho{childLabel ? ` · ${childLabel}` : ''}
            </h1>
            <p className="text-[13px] opacity-90">
              Um plano simples para agora — sem culpa, sem exagero.
            </p>
          </header>

          {/* TEMPO */}
          <div className="flex gap-2">
            {(['5', '10', '15'] as TimeMode[]).map((t) => (
              <Chip key={t} label={timeLabel(t)} active={time === t} onClick={() => setTime(t)} />
            ))}
          </div>

          {/* PLANOS */}
          <div className="space-y-3">
            {(['a', 'b', 'c'] as const).map((k) => {
              const item = effectivePlan[k]
              return (
                <div
                  key={k}
                  className={[
                    'rounded-xl border p-4 transition',
                    chosen === k ? 'bg-white border-white' : 'bg-white/70 border-white/40',
                  ].join(' ')}
                  onClick={() => setChosen(k)}
                >
                  <h3 className="font-semibold text-[#2f3a56]">{item.title}</h3>
                  <RenderEditorialText
                    text={item.how}
                    pClassName="text-[13px] text-[#545454] leading-relaxed"
                  />
                </div>
              )
            })}
          </div>

          {/* AÇÕES */}
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl bg-[#fd2597] text-white py-3 font-medium"
              onClick={() =>
                saveSelectedToMyDay(`Meu Filho: ${timeLabel(time)} — plano para agora`)
              }
            >
              Salvar no Meu Dia
            </button>

            <button
              className="rounded-xl bg-white text-[#2f3a56] px-4"
              onClick={() => saveSelectedToMyDay(`Meu Filho: ${selected.title}`)}
            >
              Só este
            </button>
          </div>

          {/* BLOCO 4 */}
          {bloco4.status === 'done' && (
            <div className="rounded-xl bg-white/80 p-4">
              <p className="text-[13px] text-[#2f3a56] leading-relaxed">{bloco4.text}</p>
            </div>
          )}

          <LegalFooter />
        </section>
      </ClientOnly>
    </main>
  )
}


