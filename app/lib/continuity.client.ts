'use client'

import { load, save } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import type { TaskItem } from '@/app/lib/myDayTasks.client'
import type { Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getContinuityTone } from '@/app/lib/experience/continuityTone'

type Tone = NonNullable<Eu360Signal['tone']>

type ContinuityMeta = {
  firstSeenDateKey?: string
  lastShownDateKey?: string
  lastPhraseId?: string
}

type ContinuityPhrase = {
  id: string
  text: string
}

const META_KEY = 'continuity/meta'

function isValidDateKey(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

function getMeta(): ContinuityMeta {
  return (load<ContinuityMeta>(META_KEY, {}) ?? {}) as ContinuityMeta
}

function setMeta(next: ContinuityMeta) {
  try {
    save(META_KEY, next)
  } catch {
    // nunca quebra UX
  }
}

function hashString(input: string): number {
  // hash simples, determinístico e barato (client-only)
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function readTasks(dateKey: string): TaskItem[] {
  try {
    const list = load<TaskItem[]>(`planner/tasks/${dateKey}`, []) ?? []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * Busca leve: verifica se existe algum histórico (qualquer dia) além do dia atual.
 * Evita varrer “muito”: limita a iteração e apenas checa presença de conteúdo.
 */
function hasAnyHistoryBesides(dateKey: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith('planner/tasks/')) keys.push(k)
      if (keys.length >= 80) break // limite deliberado (ética + performance)
    }

    for (const k of keys) {
      const dk = k.replace('planner/tasks/', '')
      if (!isValidDateKey(dk)) continue
      if (dk === dateKey) continue

      const list = readTasks(dk)
      if (Array.isArray(list) && list.length > 0) return true
    }
  } catch {
    return false
  }

  return false
}

function subtractDays(dateKey: string, days: number): string | null {
  if (!isValidDateKey(dateKey)) return null
  const [y, m, d] = dateKey.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() - Math.max(1, days))
  const yy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, '0')
  const dd = String(base.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function toDate(dk: string) {
  const [y, m, d] = dk.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function phrasesByTone(tone: Tone): ContinuityPhrase[] {
  // P13 — neutras, humanas, sem avaliação, sem cobrança, sem “progresso”
  if (tone === 'direto') {
    return [
      { id: 'd_01', text: 'Ontem foi diferente. Hoje pode ser mais leve.' },
      { id: 'd_02', text: 'Nem todo dia precisa render igual.' },
      { id: 'd_03', text: 'Você já passou por dias assim.' },
      { id: 'd_04', text: 'Um passo de cada vez, no que for possível hoje.' },
      { id: 'd_05', text: 'Se hoje for mais simples, ainda faz sentido.' },
    ]
  }

  return [
    { id: 'g_01', text: 'Você já passou por dias assim.' },
    { id: 'g_02', text: 'Nem todo dia precisa ser igual — e tudo bem.' },
    { id: 'g_03', text: 'Ontem foi diferente. Hoje pode ser mais leve.' },
    { id: 'g_04', text: 'Se hoje for só o essencial, já está valendo.' },
    { id: 'g_05', text: 'Um respiro por vez. Você não está sozinha.' },
  ]
}

function pickPhrase(params: {
  dateKey: string
  tone: Tone
  lastPhraseId?: string
  hasYesterday?: boolean
  hasHistory?: boolean
}): ContinuityPhrase | null {
  const { dateKey, tone, lastPhraseId, hasYesterday, hasHistory } = params
  const base = phrasesByTone(tone)

  if (!hasHistory) return null

  // se não há ontem, evitamos frases que mencionem “ontem”
  const filtered = base.filter((p) => (hasYesterday ? true : !p.text.toLowerCase().includes('ontem')))

  const pool = filtered.length > 0 ? filtered : base

  // Nunca repetir frase em dias seguidos
  const eligible = pool.filter((p) => p.id !== lastPhraseId)
  const finalPool = eligible.length > 0 ? eligible : pool

  // escolha determinística (por dateKey + tone)
  const idx = hashString(`${dateKey}::${tone}`) % finalPool.length
  return finalPool[idx] ?? null
}

/**
 * P13 — Meu Dia
 * Regras:
 * - no máximo 1x/dia
 * - nunca no primeiro uso (primeiro “contato” do app com continuidade)
 * - não repetir frases consecutivas
 * - base local, sem métricas explícitas
 *
 * P23 — Tom:
 * - Free: sempre gentil (seguro)
 * - Premium: respeita o tom solicitado
 */
export function getMyDayContinuityLine(input: { dateKey: string; tone: Tone }): { text: string; phraseId: string } | null {
  const { dateKey } = input
  if (!isValidDateKey(dateKey)) return null

  const tone = getContinuityTone(input.tone as any) as Tone

  const meta = getMeta()

  // Nunca aparecer no primeiro uso:
  if (!meta.firstSeenDateKey) {
    setMeta({ ...meta, firstSeenDateKey: dateKey })
    return null
  }

  // Se ainda é o mesmo dia do firstSeen, continua sem mostrar.
  if (meta.firstSeenDateKey === dateKey) return null

  // Frequência: 1x/dia
  if (meta.lastShownDateKey === dateKey) return null

  const yesterdayKey = subtractDays(dateKey, 1)
  const hasYesterday = !!(yesterdayKey && readTasks(yesterdayKey).length > 0)

  // Histórico geral (sem varrer pesado)
  const hasHistory = hasYesterday || hasAnyHistoryBesides(dateKey)

  const picked = pickPhrase({
    dateKey,
    tone,
    lastPhraseId: meta.lastPhraseId,
    hasYesterday,
    hasHistory,
  })

  if (!picked) return null

  // Persistimos somente metadados de exibição (ética + controle)
  setMeta({
    ...meta,
    lastShownDateKey: dateKey,
    lastPhraseId: picked.id,
  })

  try {
    track('continuity.my_day.shown', {
      dateKey,
      phraseId: picked.id,
      tone,
    })
  } catch {
    // silencioso
  }

  return { text: picked.text, phraseId: picked.id }
}

/**
 * P13/P15 — Eu360 (quinzenal)
 * Regras:
 * - no máximo 1x/14 dias
 * - nunca no primeiro uso
 * - nunca repetir no mesmo dia
 * - 1 frase, neutra, sem CTA, sem números, sem avaliação
 *
 * P23 — Tom:
 * - Free: sempre gentil (seguro)
 * - Premium: respeita o tom solicitado
 */
export function getEu360FortnightLine(input: { dateKey: string; tone: Tone }): { text: string; phraseId: string } | null {
  const { dateKey } = input
  if (!isValidDateKey(dateKey)) return null

  const tone = getContinuityTone(input.tone as any) as Tone

  // meta separado para Eu360 (não mistura frequência)
  const KEY = 'continuity/eu360/meta'
  const meta = (load<ContinuityMeta>(KEY, {}) ?? {}) as ContinuityMeta

  // Nunca no primeiro uso: registra e não mostra
  if (!meta.firstSeenDateKey) {
    try {
      save(KEY, { ...meta, firstSeenDateKey: dateKey })
    } catch {}
    return null
  }

  // Se ainda é o mesmo dia do firstSeen, continua sem mostrar
  if (meta.firstSeenDateKey === dateKey) return null

  // Frequência: no máximo 1x/dia
  if (meta.lastShownDateKey === dateKey) return null

  // 14 dias — guarda para dateKey inválida em meta legado
  if (meta.lastShownDateKey && isValidDateKey(meta.lastShownDateKey)) {
    const lastShown = toDate(meta.lastShownDateKey)
    const now = toDate(dateKey)

    if (!Number.isNaN(lastShown.getTime()) && !Number.isNaN(now.getTime())) {
      const diffDays = Math.floor((now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 14) return null
    }
  }

  const hasHistory = hasAnyHistoryBesides(dateKey)
  if (!hasHistory) return null

  const options: ContinuityPhrase[] =
    tone === 'direto'
      ? [
          { id: 'e_d_01', text: 'Nas últimas semanas, teve dias diferentes — e hoje você pode ir pelo possível.' },
          { id: 'e_d_02', text: 'Nas últimas semanas, o ritmo mudou algumas vezes — e está tudo bem em ajustar por aqui.' },
        ]
      : [
          { id: 'e_g_01', text: 'Nas últimas semanas, teve dias diferentes — e você pode se tratar com mais gentileza por aqui.' },
          { id: 'e_g_02', text: 'Nas últimas semanas, o ritmo variou — e o essencial continua sendo respeitar o seu momento.' },
        ]

  const lastPhraseId = meta.lastPhraseId
  const eligible = options.filter((o) => o.id !== lastPhraseId)
  const pool = eligible.length > 0 ? eligible : options
  const idx = hashString(`${dateKey}::${tone}::eu360`) % pool.length
  const picked = pool[idx]

  try {
    save(KEY, { ...meta, lastShownDateKey: dateKey, lastPhraseId: picked.id })
  } catch {}

  try {
    track('continuity.eu360.shown', { dateKey, phraseId: picked.id, tone })
  } catch {}

  return { text: picked.text, phraseId: picked.id }
}
