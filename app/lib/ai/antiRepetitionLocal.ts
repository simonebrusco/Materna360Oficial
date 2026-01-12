// app/lib/ai/antiRepetitionLocal.ts
'use client'

export type AIRepeatHub =
  | 'maternar/cuidar-de-mim'
  | 'maternar/meu-filho'
  | 'maternar/meu-dia-leve'
  | 'eu360/relatorio-ia'
  | 'planner'
  | (string & {})

export type AIRepeatEntry = {
  ts: number
  hub: AIRepeatHub
  title_signature: string
  theme_signature: string
  variation_axis?: string
}

const LS_PREFIX = 'm360:'
const LS_KEY = `${LS_PREFIX}ai:anti_repeat_history:v1`

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function nowTs() {
  return Date.now()
}

function dayKeyLocal(d = new Date()) {
  // chave local do dia (YYYY-MM-DD)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type Stored = {
  dayKey: string
  entries: AIRepeatEntry[]
}

function loadStore(): Stored {
  const raw = safeGetLS(LS_KEY)
  const parsed = safeParse<Stored>(raw)
  const today = dayKeyLocal()

  if (!parsed || parsed.dayKey !== today || !Array.isArray(parsed.entries)) {
    const fresh: Stored = { dayKey: today, entries: [] }
    safeSetLS(LS_KEY, JSON.stringify(fresh))
    return fresh
  }

  return parsed
}

function saveStore(store: Stored) {
  safeSetLS(LS_KEY, JSON.stringify(store))
}

export function resetAntiRepeatIfDayChanged() {
  // chamada segura; se dia mudou, reinicia store
  loadStore()
}

function normalizeText(s: unknown, max = 120): string {
  const t = String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // emoji
    .replace(/(^|\n)\s*[•●▪▫◦]\s+/g, '$1')
    .replace(/(^|\n)\s*[-–—]\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (!t) return ''
  return t.length <= max ? t : t.slice(0, max).trimEnd()
}

export function makeTitleSignature(input: unknown) {
  // título pode ser vazio em respostas “texto puro”; use começo do body como backup
  return normalizeText(input, 80)
}

export function makeThemeSignature(input: unknown) {
  return normalizeText(input, 140)
}

export function hasPerceptiveRepetition(args: {
  hub: AIRepeatHub
  title_signature: string
  theme_signature: string
}): boolean {
  const store = loadStore()

  const title = normalizeText(args.title_signature, 80)
  const theme = normalizeText(args.theme_signature, 140)

  if (!title && !theme) return false

  // “2 de 3 sinais iguais”:
  // sinais disponíveis aqui (local): hub, title_signature, theme_signature.
  // hub conta como sinal fixo (igual = mesmo hub).
  // então repetição perceptiva = (title igual) OU (theme igual), dentro do mesmo hub e dia.
  for (const e of store.entries) {
    if (e.hub !== args.hub) continue
    const titleEq = normalizeText(e.title_signature, 80) === title && !!title
    const themeEq = normalizeText(e.theme_signature, 140) === theme && !!theme
    if ((titleEq && themeEq) || titleEq || themeEq) return true
  }

  return false
}

export function recordAntiRepeat(args: {
  hub: AIRepeatHub
  title_signature: string
  theme_signature: string
  variation_axis?: string
}) {
  const store = loadStore()
  const entry: AIRepeatEntry = {
    ts: nowTs(),
    hub: args.hub,
    title_signature: normalizeText(args.title_signature, 80),
    theme_signature: normalizeText(args.theme_signature, 140),
    variation_axis: args.variation_axis ? String(args.variation_axis) : undefined,
  }

  // mantém lista enxuta (mesmo dia): último 60 registros
  const next = [...store.entries, entry].slice(-60)
  const updated: Stored = { dayKey: store.dayKey, entries: next }
  saveStore(updated)
}
