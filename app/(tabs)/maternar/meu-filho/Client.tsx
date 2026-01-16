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
      const titleComposite = ${items.a.title} | ${items.b.title} | ${items.c.title}
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
    const titleComposite = ${fb.a.title} | ${fb.b.title} | ${fb.c.title}
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
      subtitle: 'Sem preparar nada. Só presença simples.',
      time: '5',
      plan: {
        a: { tag: 'rápido', time: '5', title: 'Cópia de gestos', how: 'Você faz 3 gestos (bater palmas, tchau, abraço). Ele copia.' },
        b: { tag: 'calmo', time: '5', title: 'Música + colo', how: 'Uma música curta. Balance devagar e respire junto.' },
        c: { tag: 'sensório', time: '5', title: 'Texturas da casa', how: 'Mostre 3 texturas (toalha, almofada, papel). Nomeie e deixe tocar.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Explorar com os sentidos e repetir ações simples.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Transição suave: avise “agora vamos guardar” antes de trocar de atividade.' },
      connection: { label: 'Gesto de conexão', note: 'Olho no olho por 10 segundos. Sem tela. Só você e ele.' },
    },
    '10': {
      id: 'k-0-2-10',
      title: 'Presença prática em 10 min (0–2)',
      subtitle: 'Brincadeira curta + conexão no final.',
      time: '10',
      plan: {
        a: { tag: 'movimento', time: '10', title: 'Caminho de almofadas', how: 'Monte um caminho no chão e atravessem juntos 3 vezes.' },
        b: { tag: 'fala', time: '10', title: 'Nomear tudo', how: 'Passe pela casa nomeando 10 coisas e apontando junto.' },
        c: { tag: 'calmo', time: '10', title: 'Livro rápido', how: 'Escolha um livrinho e faça “voz” por 5 min. Feche com abraço.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Movimento, curiosidade e vontade de repetir.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Uma “janela de movimento” antes do jantar reduz irritação.' },
      connection: { label: 'Gesto de conexão', note: 'Um abraço demorado com respiração junto (3 respirações).' },
    },
    '15': {
      id: 'k-0-2-15',
      title: 'Momento completo em 15 min (0–2)',
      subtitle: 'Brincar + desacelerar sem estender demais.',
      time: '15',
      plan: {
        a: { tag: 'rotina', time: '15', title: 'Mini ritual pré-janta', how: '2 min de música + 8 min de brincar + 5 min para guardar juntos.' },
        b: { tag: 'sensório', time: '15', title: 'Caixa de “coisas seguras”', how: 'Separe 5 itens (colher, copo plástico, pano). Explorem juntos.' },
        c: { tag: 'calmo', time: '15', title: 'Banho de brinquedos', how: 'No banho, leve 2 brinquedos e invente 3 ações repetidas.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Ritmo próprio e necessidade de previsibilidade.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Avisos curtos (“mais 2 min e vamos…”) ajudam muito.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer em voz alta: “eu tô aqui com você” e sorrir.' },
    },
  },
  '3-4': {
    '5': {
      id: 'k-3-4-5',
      title: 'Conexão em 5 min (3–4)',
      subtitle: 'Uma brincadeira que cabe antes da janta.',
      time: '5',
      plan: {
        a: { tag: 'rápido', time: '5', title: 'História de 5 frases', how: 'Cada um fala uma frase. Vocês criam juntos 5 frases e pronto.' },
        b: { tag: 'conexão', time: '5', title: 'Desenho espelhado', how: 'Você faz 1 traço, ele copia. Troca. 5 rodadas.' },
        c: { tag: 'movimento', time: '5', title: 'Siga o líder', how: 'Você faz 4 movimentos (pular, girar, agachar). Ele repete.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Faz de conta em alta e muita imaginação.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Transições ficam melhores com aviso + contagem (ex.: “mais 2 min”).' },
      connection: { label: 'Gesto de conexão', note: 'Pergunta simples: “o que foi legal hoje?” e ouvir 20 segundos.' },
    },
    '10': {
      id: 'k-3-4-10',
      title: 'Presença prática em 10 min (3–4)',
      subtitle: 'Brincar sem produção e fechar bem.',
      time: '10',
      plan: {
        a: { tag: 'movimento', time: '10', title: 'Pista no chão', how: 'Faça uma “pista” com fita/almofadas. Ele percorre 3 vezes.' },
        b: { tag: 'faz de conta', time: '10', title: 'Restaurante relâmpago', how: 'Ele “cozinha” e serve. Você faz 2 pedidos engraçados.' },
        c: { tag: 'calmo', time: '10', title: 'Cartas de elogio', how: 'Diga 2 coisas específicas: “eu gostei quando você…”.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Teste de limites e necessidade de previsibilidade.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Um mini ritual pré-janta (2 min) organiza o resto do período.' },
      connection: { label: 'Gesto de conexão', note: 'Toque no ombro + olhar nos olhos por 5 segundos.' },
    },
    '15': {
      id: 'k-3-4-15',
      title: 'Momento completo em 15 min (3–4)',
      subtitle: 'O clássico: brincar + organizar + fechar com carinho.',
      time: '15',
      plan: {
        a: { tag: 'casa', time: '15', title: 'Caça aos tesouros', how: 'Escolham 3 itens para achar. Depois guardam juntos.' },
        b: { tag: 'faz de conta', time: '15', title: 'Missão do herói', how: '3 “missões”: pular, buscar, entregar. Você narra.' },
        c: { tag: 'calmo', time: '15', title: 'História + abraço', how: '10 min de história inventada + 5 min de abraço e guardar.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Imaginação + necessidade de rotina clara.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'O combinado “brinca e depois guarda” funciona melhor com timer simples.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer: “obrigada por brincar comigo” e sorrir.' },
    },
  },
  '5-6': {
    '5': {
      id: 'k-5-6-5',
      title: 'Conexão em 5 min (5–6)',
      subtitle: 'Rápido e direto: presença sem esticar.',
      time: '5',
      plan: {
        a: { tag: 'fala', time: '5', title: '2 perguntas + 1 abraço', how: 'Pergunte “melhor parte do dia?” e “uma coisa difícil?”. Abraço.' },
        b: { tag: 'rápido', time: '5', title: 'Desafio do minuto', how: '1 min de equilíbrio / 1 min de pular / 1 min de alongar.' },
        c: { tag: 'calmo', time: '5', title: 'Leitura relâmpago', how: 'Leia 2 páginas e combine “depois continua”.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Curiosidade, perguntas e vontade de participar das decisões.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Um “combinado curto” evita disputa: “5 min e depois…”.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer algo específico: “eu vi você se esforçando em…”.' },
    },
    '10': {
      id: 'k-5-6-10',
      title: 'Presença prática em 10 min (5–6)',
      subtitle: 'Brincar e fechar com organização mínima.',
      time: '10',
      plan: {
        a: { tag: 'movimento', time: '10', title: 'Circuito rápido', how: '3 estações: pular, agachar, correr parado. 2 rodadas.' },
        b: { tag: 'mesa', time: '10', title: 'Desenho com tema', how: 'Tema: “o melhor do dia”. 5 min desenha, 5 min conta.' },
        c: { tag: 'casa', time: '10', title: 'Ajuda rápida', how: 'Ele ajuda em 1 tarefa (pôr guardanapo). Você elogia o esforço.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Mais autonomia e mais opinião.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Transição fica mais fácil quando ele tem uma “função” simples.' },
      connection: { label: 'Gesto de conexão', note: 'Tempo 1:1 de 5 minutos sem tela.' },
    },
    '15': {
      id: 'k-5-6-15',
      title: 'Momento completo em 15 min (5–6)',
      subtitle: 'Um ciclo simples: brincar → ajudar → fechar.',
      time: '15',
      plan: {
        a: { tag: 'equilíbrio', time: '15', title: 'Brinca 10 + ajuda 5', how: '10 min de jogo rápido + 5 min ajudando numa tarefa pequena.' },
        b: { tag: 'criativo', time: '15', title: 'História com desenho', how: '5 min desenha, 10 min cria história e você escreve 3 frases.' },
        c: { tag: 'calmo', time: '15', title: 'Jogo de perguntas', how: 'Faça 6 perguntas leves (“qual animal…?”). Fecha com abraço.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Vontade de participar e de ser levado a sério.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Um timer visível ajuda a encerrar sem briga.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer: “eu gosto de você do jeito que você é” (curto, direto).' },
    },
  },
  '6+': {
    '5': {
      id: 'k-6p-5',
      title: 'Conexão em 5 min (6+)',
      subtitle: 'Curto e respeitoso — sem infantilizar.',
      time: '5',
      plan: {
        a: { tag: 'fala', time: '5', title: 'Check-in rápido', how: '“De 0 a 10, como foi seu dia?” e uma frase de escuta.' },
        b: { tag: 'corpo', time: '5', title: 'Descompressão', how: '2 min alongar + 2 min respirar + 1 min combinado do dia.' },
        c: { tag: 'casa', time: '5', title: 'Ajuda prática', how: 'Ele ajuda em 1 coisa. Você agradece e reconhece.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Mais autonomia, mais opinião, mais sensibilidade a respeito.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Combinar “o que vem agora” evita atrito nas transições.' },
      connection: { label: 'Gesto de conexão', note: 'Escuta de 30 segundos sem corrigir.' },
    },
    '10': {
      id: 'k-6p-10',
      title: 'Presença prática em 10 min (6+)',
      subtitle: 'Sem grandes jogos: presença e organização.',
      time: '10',
      plan: {
        a: { tag: 'fala', time: '10', title: 'Conversa guiada', how: '2 perguntas + 1 coisa que ele escolhe fazer (rápida).' },
        b: { tag: 'jogo', time: '10', title: 'Mini competição', how: 'Desafio curto (quem guarda mais rápido / quem acha 3 itens).' },
        c: { tag: 'casa', time: '10', title: 'Função + elogio', how: 'Ele escolhe uma função e você elogia o esforço, não o resultado.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Necessidade de sentir controle e escolha.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Dar 2 opções evita disputa (“isso ou aquilo”).' },
      connection: { label: 'Gesto de conexão', note: 'Perguntar: “quer minha ajuda ou só que eu te ouça?”' },
    },
    '15': {
      id: 'k-6p-15',
      title: 'Momento completo em 15 min (6+)',
      subtitle: 'Conexão + rotina leve do jeito que cabe.',
      time: '15',
      plan: {
        a: { tag: 'equilíbrio', time: '15', title: '10 min + 5 min', how: '10 min de escolha dele + 5 min de organização simples.' },
        b: { tag: 'casa', time: '15', title: 'Arrumar junto', how: 'Arrumar um cantinho por 10 min com música. Fecha com conversa.' },
        c: { tag: 'fala', time: '15', title: 'Plano para depois', how: '2 min check-in + 10 min atividade + 3 min combinados.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Autonomia e necessidade de respeito nas decisões.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Combinados curtos e claros reduzem conflito.' },
      connection: { label: 'Gesto de conexão', note: 'Reconhecer: “eu vi que foi difícil e você tentou”.' },
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
    working = working.replace(new RegExp(\\s*${m}, 'g'), \n\n${m})
  })

  const parts = working
    .split(/\n\n|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length === 0) return [text]
  return parts.slice(0, 4)
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
  const [profileSource, setProfileSource] = useState<ProfileSource>('none')

  const [familyDoneToday, setFamilyDoneToday] = useState(false)

  // filtros: brincadeiras
  const [playLocation, setPlayLocation] = useState<PlayLocation>('casa')
  const [skills, setSkills] = useState<SkillId[]>(['emocional'])

  // foco: fase
  const [faseFoco, setFaseFoco] = useState<FaseFoco>('emocao')

  // seleção mínima de tema antes de gerar Bloco 3
  const [rotinaTema, setRotinaTema] = useState<RotinaTema | null>(null)
  const [conexaoTema, setConexaoTema] = useState<ConexaoTema | null>(null)

  // Bloco 1
  const [bloco1, setBloco1] = useState<Bloco1State>({ status: 'idle' })
  const bloco1ReqSeq = useRef(0)

  // Bloco 2
  const [bloco2, setBloco2] = useState<Bloco2State>({ status: 'idle' })
  const bloco2ReqSeq = useRef(0)

  // Bloco 3
  const [bloco3, setBloco3] = useState<Bloco3State>({ status: 'idle' })
  const bloco3ReqSeq = useRef(0)

  // Bloco 4
  const [bloco4, setBloco4] = useState<Bloco4State>({ status: 'idle' })
  const bloco4ReqSeq = useRef(0)

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'meu-filho', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    let inferred: ReturnType<typeof inferContext> = {
      time: '15',
      age: '3-4',
      playLocation: 'casa',
      skills: ['emocional'],
      faseFoco: 'emocao',
    }

    try {
      inferred = inferContext()
    } catch {}

    setTime(inferred.time)
    setAge(inferred.age)
    setChildLabel(inferred.childLabel)
    setPlayLocation(inferred.playLocation)
    setSkills(inferred.skills)
    setFaseFoco(inferred.faseFoco)
    setStep('brincadeiras')

    setBloco1({ status: 'idle' })
    setBloco2({ status: 'idle' })
    setBloco3({ status: 'idle' })
    setBloco4({ status: 'idle' })

    try {
      const snap = getProfileSnapshot()
      setProfileSource(snap.source)
      try {
        track('meu_filho.open', {
          time: inferred.time,
          age: inferred.age,
          childLabel: inferred.childLabel ?? null,
          profileSource: snap.source,
        })
      } catch {}
    } catch {}

    try {
      const js = getJourneySnapshot()
      setFamilyDoneToday(js.family.doneToday)
    } catch {}
  }, [])

  const kit = useMemo(() => KITS[age][time], [age, time])

  const effectivePlan: { a: PlanItem; b: PlanItem; c: PlanItem } | null = useMemo(() => {
    if (bloco2.status === 'done') return bloco2.items
    return null
  }, [bloco2])

  const selected = useMemo(() => {
    if (effectivePlan) return effectivePlan[chosen]
    return kit.plan[chosen]
  }, [effectivePlan, chosen, kit.plan])

  function go(next: Step) {
    setStep(next)
    try {
      track('meu_filho.step', { step: next })
    } catch {}
  }

  function hardResetGenerated() {
    setBloco1({ status: 'idle' })
    setBloco2({ status: 'idle' })
    setBloco3({ status: 'idle' })
    setBloco4({ status: 'idle' })
  }

  function onSelectTime(next: TimeMode) {
    setTime(next)
    setChosen('a')

    safeSetLS(HUB_PREF.time, next)
    safeSetLS('eu360_time_with_child', next)

    setRotinaTema(null)
    setConexaoTema(null)
    hardResetGenerated()

    try {
      track('meu_filho.time.select', { time: next })
    } catch {}
  }

  function onSelectAge(next: AgeBand) {
    setAge(next)
    setChosen('a')

    safeSetLS(HUB_PREF.ageBand, next)
    safeSetLS('eu360_child_age_band', next)

    setRotinaTema(null)
    setConexaoTema(null)
    hardResetGenerated()

    try {
      track('meu_filho.age.select', { age: next, reason: 'manual_override' })
    } catch {}
  }

  function onChoose(k: 'a' | 'b' | 'c') {
    setChosen(k)
    try {
      track('meu_filho.plan.choose', {
        which: k,
        time,
        age,
        source: bloco2.status === 'done' ? bloco2.source : 'none',
      })
    } catch {}
  }

  // ✅ FIX typing (SkillId[] garantido)
  function toggleSkill(id: SkillId) {
    setSkills((prev): SkillId[] => {
      const has = prev.includes(id)
      const next: SkillId[] = has ? prev.filter((x) => x !== id) : [...prev, id]
      const safe: SkillId[] = next.length ? next : (['emocional'] as SkillId[])

      safeSetLS(HUB_PREF_FILTERS.skills, JSON.stringify(safe))
      return safe
    })

    setBloco2({ status: 'idle' })
  }

  function onSelectPlayLocation(loc: PlayLocation) {
    setPlayLocation(loc)
    safeSetLS(HUB_PREF_FILTERS.playLocation, loc)
    setBloco2({ status: 'idle' })
  }

  function onSelectFaseFoco(f: FaseFoco) {
    setFaseFoco(f)
    safeSetLS(HUB_PREF_FILTERS.faseFoco, f)
    setBloco4({ status: 'idle' })
  }

  async function generateBloco1() {
    const seq = ++bloco1ReqSeq.current
    setBloco1({ status: 'loading' })

    const tempoDisponivel = Number(time)
    const themeSignature = bloco1|age:${age}|time:${time}|tempo:${tempoDisponivel}

    const out = await withAntiRepeatText({
      themeSignature,
      run: async (nonce) => await fetchBloco1Plan({ tempoDisponivel, nonce }),
      fallback: () => clampMeuFilhoBloco1Text(BLOCO1_FALLBACK[age][time]),
      maxTries: 2,
    })

    if (seq !== bloco1ReqSeq.current) return
    setBloco1({ status: 'done', text: out.text, source: out.source })
  }

  async function generateBloco2() {
    const seq = ++bloco2ReqSeq.current
    setBloco2({ status: 'loading' })

    const tempoDisponivel = Number(time)
    const themeSignature = bloco2|age:${age}|time:${time}|tempo:${tempoDisponivel}|loc:${playLocation}|skills:${skills.join(',')}

    const out = await withAntiRepeatPack({
      themeSignature,
      run: async (nonce) => await fetchBloco2Cards({ tempoDisponivel, age, playLocation, skills, nonce }),
      fallback: () => kit.plan,
      maxTries: 2,
    })

    if (seq !== bloco2ReqSeq.current) return
    setBloco2({ status: 'done', items: out.items, source: out.source })
    setChosen('a')
  }

  async function generateBloco4() {
    const seq = ++bloco4ReqSeq.current
    setBloco4({ status: 'loading' })

    const momento = inferMomentoDesenvolvimento(age)
    const themeSignature = bloco4|age:${age}|foco:${faseFoco}|momento:${momento ?? 'na'}

    const out = await withAntiRepeatText({
      themeSignature,
      run: async (nonce) =>
        await fetchBloco4Suggestion({
          faixa_etaria: age,
          momento_desenvolvimento: momento,
          contexto: 'fase',
          foco: faseFoco,
          nonce,
        }),
      fallback: () => BLOCO4_FALLBACK[age],
      maxTries: 2,
    })

    if (seq !== bloco4ReqSeq.current) return
    setBloco4({ status: 'done', text: out.text, source: out.source, momento })
  }

  async function generateBloco3(kind: Bloco3Type) {
    const seq = ++bloco3ReqSeq.current

    const momento: MomentoDoDia = kind === 'rotina' ? 'transicao' : 'noite'
    const tema = kind === 'rotina' ? rotinaTema : conexaoTema
    if (!tema) {
      toast.info('Escolha um tema antes de gerar.')
      return
    }

    setBloco3({ status: 'loading', kind })

    const themeSignature = bloco3|kind:${kind}|age:${age}|momento:${momento}|tema:${String(tema)}

    const out = await withAntiRepeatText({
      themeSignature,
      run: async (nonce) =>
        await fetchBloco3Suggestion({
          faixa_etaria: age,
          momento_do_dia: momento,
          tipo_experiencia: kind,
          contexto: 'continuidade',
          tema,
          nonce,
        }),
      fallback: () => BLOCO3_FALLBACK[kind][age],
      maxTries: 2,
    })

    if (seq !== bloco3ReqSeq.current) return
    setBloco3({ status: 'done', kind, text: out.text, source: out.source, momento })
  }

  function saveSelectedToMyDay(title: string) {
    const ORIGIN = 'family' as const
    const SOURCE = MY_DAY_SOURCES.MATERNAR_MEU_FILHO

    const today = listMyDayTasks()
    const activeCount = countActiveFamilyFromMeuFilhoToday(today)
    if (activeCount >= 3) {
      toast.info('Você já salvou 3 ações do Meu Filho hoje. Conclua uma ou escolha só 1 para agora.')
      return
    }

    const res = addTaskToMyDay({ title, origin: ORIGIN, source: SOURCE })

    if (res.limitHit) {
      toast.info('Seu Meu Dia já está cheio hoje. Conclua ou adie algo antes de salvar mais.')
      return
    }

    if (res.created) toast.success('Salvo no Meu Dia')
    else toast.info('Já estava no Meu Dia')
  }

  function registerFamilyJourney() {
    if (familyDoneToday) {
      toast.info('Isso já contou para a sua Jornada hoje')
      return
    }
    markJourneyFamilyDone(MY_DAY_SOURCES.MATERNAR_MEU_FILHO)
    setFamilyDoneToday(true)
    toast.success('Registrado na sua Jornada')
  }

  const bloco1Text = bloco1.status === 'done' ? bloco1.text : null
  const bloco2Items = bloco2.status === 'done' ? bloco2.items : null
  const bloco3Text = bloco3.status === 'done' ? bloco3.text : null
  const bloco4Text = bloco4.status === 'done' ? bloco4.text : null

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
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1">
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Meu Filho
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Você entra sem ideias e sai com um plano simples para agora — sem precisar pensar.
              </p>

              {childLabel ? (
                <div className="text-[12px] text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
                  Ajustado para: <span className="font-semibold text-white">{childLabel}</span>
                </div>
              ) : null}

              {/* (debug silencioso de fonte, opcional manter) */}
              {profileSource !== 'none' ? <div className="text-[11px] text-white/60">Fonte de perfil: {profileSource}</div> : null}
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
              {/* TOP CONTROLS */}
              <div className="p-4 md:p-6 border-b border-white/25">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                      <AppIcon name="toy" size={22} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        Passo {stepIndex(step)}/4 • {timeTitle(time)} • {timeLabel(time)} • faixa {age}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Plano pronto para agora
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">{timeHint(time)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => go('brincadeiras')}
                    className="
                      rounded-full
                      bg-white/90 hover:bg-white
                      text-[#2f3a56]
                      px-4 py-2 text-[12px]
                      shadow-lg transition
                    "
                  >
                    Começar
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Quanto tempo você tem agora?</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['5', '10', '15'] as TimeMode[]).map((t) => {
                        const active = time === t
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onSelectTime(t)}
                            className={[
                              'rounded-xl border px-3 py-2 text-[12px] text-left transition',
                              active ? 'bg-white/90 border-white/60 text-[#2f3a56]' : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
                            ].join(' ')}
                          >
                            <div className="font-semibold">{timeLabel(t)}</div>
                            <div className="text-[11px] opacity-90">{timeTitle(t)}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Faixa (ajusta a ideia)</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['0-2', '3-4', '5-6', '6+'] as AgeBand[]).map((a) => {
                        const active = age === a
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => onSelectAge(a)}
                            className={[
                              'rounded-xl border px-2.5 py-2 text-[12px] transition',
                              active ? 'bg-white/90 border-white/60 text-[#2f3a56]' : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
                            ].join(' ')}
                          >
                            {a}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Chip label="Brincadeiras" active={step === 'brincadeiras'} onClick={() => go('brincadeiras')} />
                  <Chip label="Fase" active={step === 'desenvolvimento'} onClick={() => go('desenvolvimento')} />
                  <Chip label="Rotina" active={step === 'rotina'} onClick={() => go('rotina')} />
                  <Chip label="Conexão" active={step === 'conexao'} onClick={() => go('conexao')} />
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 md:p-6">
                {/* STEP 1 — BRINCADEIRAS */}
                {step === 'brincadeiras' ? (
                  <div className="rounded-3xl bg-white/85 border border-white/60 shadow-[0_20px_60px_rgba(184,35,107,0.18)] overflow-hidden">
                    <div className="p-5 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[#ffd8e6] flex items-center justify-center shrink-0">
                          <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#fd2597]">Plano pronto para agora</div>
                          <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-1">
                            Você só escolhe o cenário — eu te entrego 3 opções boas.
                          </div>
                          <div className="text-[13px] text-[#545454] mt-1">Sem catálogo infinito. Só 3 opções que cabem no seu tempo.</div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-white border border-[#ffd1e6] p-4">
                          <div className="text-[13px] font-semibold text-[#2f3a56]">Onde vocês estão?</div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {PLAY_LOCATIONS.map((l) => {
                              const active = playLocation === l.id
                              return (
                                <button
                                  key={l.id}
                                  type="button"
                                  onClick={() => onSelectPlayLocation(l.id)}
                                  className={[
                                    'rounded-xl border p-3 text-left transition',
                                    active ? 'bg-[#fff3f8] border-[#fd2597]' : 'bg-white border-[#ffd1e6] hover:bg-[#fff7fa]',
                                  ].join(' ')}
                                >
                                  <div className="text-[12px] font-semibold text-[#2f3a56]">{l.label}</div>
                                  <div className="text-[11px] text-[#545454] mt-1">{l.hint}</div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white border border-[#ffd1e6] p-4">
                          <div className="text-[13px] font-semibold text-[#2f3a56]">Que habilidades você quer estimular?</div>
                          <div className="text-[12px] text-[#545454] mt-1">
                            Você pode marcar mais de uma. Se deixar tudo vazio, volta para “Emoções”.
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {SKILLS.map((s) => {
                              const active = skills.includes(s.id)
                              return <SubChip key={s.id} label={s.label} active={active} onClick={() => toggleSkill(s.id)} />
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={generateBloco1}
                          className="rounded-full bg-[#fd2597] hover:brightness-95 text-white px-4 py-2 text-[12px] shadow-lg transition"
                        >
                          Gerar plano para agora
                        </button>
                        <button
                          type="button"
                          onClick={generateBloco2}
                          className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] shadow-sm transition"
                        >
                          Gerar 3 opções
                        </button>
                        <button
                          type="button"
                          onClick={() => go('desenvolvimento')}
                          className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] shadow-sm transition"
                        >
                          Ir para Fase
                        </button>
                      </div>

                      <div className="mt-5 border-t border-[#ffd1e6] pt-5">
                        <div className="text-[12px] font-semibold text-[#fd2597]">Para agora</div>

                        <div className="mt-2 rounded-2xl bg-[#fff7fa] border border-[#ffd1e6] p-4">
                          {bloco1.status === 'idle' ? (
                            <div className="text-[13px] text-[#545454]">Clique em “Gerar plano para agora” para receber uma sugestão curta e pronta.</div>
                          ) : bloco1.status === 'loading' ? (
                            <div className="text-[13px] text-[#545454]">Gerando…</div>
                          ) : (
                            <RenderEditorialText text={bloco1Text} pClassName="text-[14px] text-[#2f3a56] leading-relaxed" />
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveSelectedToMyDay(Meu Filho: ${timeLabel(time)} — plano para agora)}
                              className="rounded-full bg-[#fd2597] hover:brightness-95 text-white px-4 py-2 text-[12px] shadow-md transition"
                            >
                              Salvar no Meu Dia
                            </button>
                            <button
                              type="button"
                              onClick={generateBloco1}
                              className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                            >
                              Nova sugestão
                            </button>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="text-[12px] font-semibold text-[#fd2597]">3 opções (com base nos filtros)</div>

                          {bloco2.status === 'idle' ? (
                            <div className="mt-2 text-[13px] text-[#545454]">
                              Clique em “Gerar 3 opções” para receber brincadeiras completas (com começo, meio e fim).
                            </div>
                          ) : bloco2.status === 'loading' ? (
                            <div className="mt-2 text-[13px] text-[#545454]">Gerando…</div>
                          ) : (
                            <div className="mt-3 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(['a', 'b', 'c'] as const).map((k) => {
                                  const it = (bloco2Items ?? kit.plan)[k]
                                  const active = chosen === k
                                  return (
                                    <button
                                      key={k}
                                      type="button"
                                      onClick={() => onChoose(k)}
                                      className={[
                                        'rounded-2xl border p-4 text-left transition',
                                        active ? 'bg-[#fff3f8] border-[#fd2597]' : 'bg-white border-[#ffd1e6] hover:bg-[#fff7fa]',
                                      ].join(' ')}
                                    >
                                      <div className="text-[11px] font-semibold text-[#fd2597] uppercase tracking-wide">
                                        {it.tag} • {timeLabel(it.time)}
                                      </div>
                                      <div className="mt-1 text-[14px] font-semibold text-[#2f3a56]">{it.title}</div>
                                      <div className="mt-2 text-[12px] text-[#545454] line-clamp-3">{it.how}</div>
                                    </button>
                                  )
                                })}
                              </div>

                              <div className="rounded-2xl bg-[#fff7fa] border border-[#ffd1e6] p-4">
                                <div className="text-[12px] font-semibold text-[#fd2597]">Opção selecionada</div>
                                <div className="mt-1 text-[15px] font-semibold text-[#2f3a56]">{selected.title}</div>
                                <div className="mt-2">
                                  <RenderEditorialText text={selected.how} pClassName="text-[13px] text-[#2f3a56] leading-relaxed" />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveSelectedToMyDay(Meu Filho: ${selected.title})}
                                    className="rounded-full bg-[#fd2597] hover:brightness-95 text-white px-4 py-2 text-[12px] shadow-md transition"
                                  >
                                    Salvar no Meu Dia
                                  </button>
                                  <button
                                    type="button"
                                    onClick={generateBloco2}
                                    className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                                  >
                                    Gerar novas 3 opções
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => go('conexao')}
                                    className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                                  >
                                    Fechar com conexão
                                  </button>
                                </div>
                              </div>

                              <div className="text-[11px] text-[#545454]">Fonte: {bloco2.source === 'ai' ? 'gerado' : 'opções locais (fallback)'}.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* STEP 2 — FASE */}
                {step === 'desenvolvimento' ? (
                  <div className="rounded-3xl bg-white/85 border border-white/60 shadow-[0_20px_60px_rgba(184,35,107,0.18)] overflow-hidden">
                    <div className="p-5 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[#ffd8e6] flex items-center justify-center shrink-0">
                          <AppIcon name="info" size={20} className="text-[#fd2597]" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#fd2597]">Desenvolvimento por fase</div>
                          <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-1">O que costuma aparecer</div>
                          <div className="text-[13px] text-[#545454] mt-1">Pistas simples para ajustar o jeito de fazer hoje. Sem rótulos.</div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white border border-[#ffd1e6] p-4">
                        <div className="text-[12px] font-semibold text-[#2f3a56]">Escolha o foco</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {FASE_FOCOS.map((f) => (
                            <SubChip key={f.id} label={f.label} active={faseFoco === f.id} onClick={() => onSelectFaseFoco(f.id)} />
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={generateBloco4}
                            className="rounded-full bg-[#fd2597] hover:brightness-95 text-white px-4 py-2 text-[12px] shadow-md transition"
                          >
                            Nova orientação
                          </button>
                          <button
                            type="button"
                            onClick={() => go('rotina')}
                            className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                          >
                            Ajuste de rotina
                          </button>
                          <button
                            type="button"
                            onClick={() => go('brincadeiras')}
                            className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                          >
                            Voltar para brincadeiras
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#fff7fa] border border-[#ffd1e6] p-4">
                        <div className="text-[12px] font-semibold text-[#fd2597]">Nesta fase</div>
                        <div className="mt-2">
                          {bloco4.status === 'idle' ? (
                            <div className="text-[13px] text-[#545454]">Clique em “Nova orientação” para receber uma frase útil para hoje.</div>
                          ) : bloco4.status === 'loading' ? (
                            <div className="text-[13px] text-[#545454]">Gerando…</div>
                          ) : (
                            <div className="text-[14px] text-[#2f3a56] leading-relaxed">{bloco4Text}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* STEP 3 — ROTINA */}
                {step === 'rotina' ? (
                  <div className="rounded-3xl bg-white/85 border border-white/60 shadow-[0_20px_60px_rgba(184,35,107,0.18)] overflow-hidden">
                    <div className="p-5 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[#ffd8e6] flex items-center justify-center shrink-0">
                          <AppIcon name="sun" size={20} className="text-[#fd2597]" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#fd2597]">Rotina leve da criança</div>
                          <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-1">Ajuste que ajuda hoje</div>
                          <div className="text-[13px] text-[#545454] mt-1">Um ajuste pequeno para o dia fluir melhor — sem “rotina perfeita”.</div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white border border-[#ffd1e6] p-4">
                        <div className="text-[12px] font-semibold text-[#2f3a56]">Escolha o tema</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ROTINA_TEMAS.map((t) => (
                            <SubChip key={t.id} label={t.label} active={rotinaTema === t.id} onClick={() => setRotinaTema(t.id)} />
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => generateBloco3('rotina')}
                            className="rounded-full bg-[#fd2597] hover:brightness-95 text-white px-4 py-2 text-[12px] shadow-md transition"
                          >
                            Novo ajuste
                          </button>
                          <button
                            type="button"
                            onClick={() => go('brincadeiras')}
                            className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                          >
                            Voltar para brincadeiras
                          </button>
                          <button
                            type="button"
                            onClick={() => go('conexao')}
                            className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                          >
                            Ir para conexão
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#fff7fa] border border-[#ffd1e6] p-4">
                        <div className="text-[12px] font-semibold text-[#fd2597]">Para encaixar no dia</div>
                        <div className="mt-2">
                          {bloco3.status === 'loading' && bloco3.kind === 'rotina' ? (
                            <div className="text-[13px] text-[#545454]">Gerando…</div>
                          ) : bloco3.status === 'done' && bloco3.kind === 'rotina' ? (
                            <RenderEditorialText text={bloco3Text} pClassName="text-[14px] text-[#2f3a56] leading-relaxed" />
                          ) : (
                            <div className="text-[13px] text-[#545454]">Selecione um tema e clique em “Novo ajuste”.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* STEP 4 — CONEXÃO */}
                {step === 'conexao' ? (
                  <div className="rounded-3xl bg-white/85 border border-white/60 shadow-[0_20px_60px_rgba(184,35,107,0.18)] overflow-hidden">
                    <div className="p-5 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[#ffd8e6] flex items-center justify-center shrink-0">
                          <AppIcon name="heart" size={20} className="text-[#fd2597]" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#fd2597]">Gestos de conexão</div>
                          <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-1">Gesto de conexão</div>
                          <div className="text-[13px] text-[#545454] mt-1">O final simples que faz a criança sentir: “minha mãe tá aqui”.</div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white border border-[#ffd1e6] p-4">
                        <div className="text-[12px] font-semibold text-[#2f3a56]">Escolha o tema</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {CONEXAO_TEMAS.map((t) => (
                            <SubChip key={t.id} label={t.label} active={conexaoTema === t.id} onClick={() => setConexaoTema(t.id)} />
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => generateBloco3('conexao')}
                            className="rounded-full bg-[#fd2597] hover:brightness-95 text-white px-4 py-2 text-[12px] shadow-md transition"
                          >
                            Novo gesto
                          </button>

                          <button
                            type="button"
                            onClick={registerFamilyJourney}
                            className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                          >
                            Registrar na Minha Jornada
                          </button>

                          <button
                            type="button"
                            onClick={() => go('brincadeiras')}
                            className="rounded-full bg-white hover:bg-[#fff3f8] text-[#2f3a56] border border-[#ffd1e6] px-4 py-2 text-[12px] transition"
                          >
                            Escolher outra brincadeira
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#fff7fa] border border-[#ffd1e6] p-4">
                        <div className="text-[12px] font-semibold text-[#fd2597]">Para encerrar</div>
                        <div className="mt-2">
                          {bloco3.status === 'loading' && bloco3.kind === 'conexao' ? (
                            <div className="text-[13px] text-[#545454]">Gerando…</div>
                          ) : bloco3.status === 'done' && bloco3.kind === 'conexao' ? (
                            <RenderEditorialText text={bloco3Text} pClassName="text-[14px] text-[#2f3a56] leading-relaxed" />
                          ) : (
                            <div className="text-[13px] text-[#545454]">Selecione um tema e clique em “Novo gesto”.</div>
                          )}
                        </div>
                      </div>
                    </div>
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
