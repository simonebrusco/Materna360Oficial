'use client'

/**
 * Materna360 — P26
 * Core único de leitura de perfil (client)
 *
 * Objetivo:
 * - Ler "snapshot" do perfil de forma segura e estável
 * - Prioridade: LS oficial (eu360_profile_v1) → outros LS conhecidos → fallback por prefixo
 * - Normalizar para um formato único consumível pelos hubs (Maternar)
 */

export type ProfileSource = 'ls_primary' | 'ls_secondary' | 'ls_scan' | 'none'

export type ChildSnapshot = {
  id: string
  label: string
  name?: string
  ageMonths: number | null
}

export type ProfileSnapshot = {
  source: ProfileSource
  motherName: string | null
  children: ChildSnapshot[]
  updatedAtISO: string | null
}

const LS_PREFIX = 'm360:'
const LS_PRIMARY = 'eu360_profile_v1'

function safeGetLSRaw(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const direct = window.localStorage.getItem(key)
    if (direct !== null) return direct
    return window.localStorage.getItem(`${LS_PREFIX}${key}`)
  } catch {
    return null
  }
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeParseInt(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number.parseInt(String(v).trim(), 10)
  if (!Number.isFinite(n)) return null
  if (Number.isNaN(n)) return null
  return n
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

function clampMonths(n: number) {
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(240, Math.floor(n)))
}

function stripDiacritics(s: string) {
  try {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  } catch {
    // fallback seguro
    return s
  }
}

/**
 * Aceita vários formatos para idade:
 * - number (meses)
 * - "18" (meses)
 * - "2 anos"
 * - "10 meses"
 * - "2-3 anos" -> pega o superior (3 anos)
 * - "18-24 meses" -> pega superior (24)
 */
function coerceMonthsFromUnknown(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return clampMonths(v)

  const raw = String(v).trim().toLowerCase()
  if (!raw) return null

  const s = stripDiacritics(raw) // pega "mês" como "mes"

  const direct = safeParseInt(s)
  if (direct !== null) return clampMonths(direct)

  const mYears = s.match(/(\d+)\s*ano/)
  if (mYears?.[1]) return clampMonths(Number(mYears[1]) * 12)

  const mMonths = s.match(/(\d+)\s*mes/)
  if (mMonths?.[1]) return clampMonths(Number(mMonths[1]))

  const mRangeYears = s.match(/(\d+)\s*(a|-|–)\s*(\d+)\s*ano/)
  if (mRangeYears?.[3]) return clampMonths(Number(mRangeYears[3]) * 12)

  const mRangeMonths = s.match(/(\d+)\s*(a|-|–)\s*(\d+)\s*mes/)
  if (mRangeMonths?.[3]) return clampMonths(Number(mRangeMonths[3]))

  return null
}

function normalizeChildrenFromAny(obj: any): ChildSnapshot[] {
  const collected: any[] = []

  if (Array.isArray(obj)) {
    collected.push(...obj)
  } else if (obj && typeof obj === 'object') {
    const arr =
      obj?.filhos ??
      obj?.children ??
      obj?.kids ??
      obj?.data?.filhos ??
      obj?.data?.children ??
      obj?.data?.kids ??
      obj?.profile?.filhos ??
      obj?.profile?.children ??
      obj?.eu360?.profile?.filhos

    if (Array.isArray(arr)) collected.push(...arr)
  }

  const out: ChildSnapshot[] = []
  const seen = new Set<string>()
  let idx = 1

  for (const c of collected) {
    const id = String(c?.id ?? c?.key ?? c?.uuid ?? `child_${idx++}`)
    const name = String(c?.nome ?? c?.name ?? '').trim()
    const label = name ? name : `Filho ${out.length + 1}`

    const explicitMonths =
      coerceMonthsFromUnknown(
        c?.idadeMeses ?? c?.idade_meses ?? c?.ageMonths ?? c?.age_months ?? c?.months
      ) ?? coerceMonthsFromUnknown(c?.idade ?? c?.age)

    const derivedFromBirth = (() => {
      const d =
        safeParseDate(
          c?.dataNascimento ??
            c?.data_nascimento ??
            c?.birthdate ??
            c?.birthDate ??
            c?.dob ??
            c?.nascimento
        ) || null
      return d ? clampMonths(monthsBetween(d, new Date())) : null
    })()

    const ageMonths = explicitMonths ?? derivedFromBirth ?? null

    const key = `${id}::${label.toLowerCase()}::${ageMonths ?? 'null'}`
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      id,
      label,
      name: name || undefined,
      ageMonths,
    })
  }

  return out
}

function normalizeMotherNameFromAny(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null

  const candidates = [
    obj?.nomeMae,
    obj?.motherName,
    obj?.name,
    obj?.userPreferredName,
    obj?.profile?.nomeMae,
    obj?.eu360?.profile?.nomeMae,
    obj?.eu360?.profile?.userPreferredName,
  ]

  for (const c of candidates) {
    const s = typeof c === 'string' ? c.trim() : ''
    if (s) return s
  }

  return null
}

function normalizeUpdatedAtFromAny(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null

  const candidates = [
    obj?.updatedAtISO,
    obj?.updatedAt,
    obj?.eu360?.updatedAtISO,
    obj?.eu360?.profile?.updatedAtISO,
    obj?.eu360?.profile?.updatedAt,
  ]

  for (const c of candidates) {
    const s = typeof c === 'string' ? c.trim() : ''
    if (s) return s
  }

  return null
}

function getKnownCandidates() {
  return [
    LS_PRIMARY,

    // variantes comuns já vistas em código/iterações
    'eu360_profile',
    'eu360_profile_v0',
    'eu360_state',
    'eu360_data',
    'eu360_form',
    'eu360_form_v1',
    'eu360_children',
    'eu360_children_v1',
    'eu360_filhos',
    'eu360_filhos_v1',
    'eu360_kids',
    'eu360_kids_v1',
  ]
}

function scanEu360Prefixed(): Array<{ key: string; obj: any }> {
  const out: Array<{ key: string; obj: any }> = []
  try {
    if (typeof window === 'undefined') return out

    for (let i = 0; i < window.localStorage.length; i++) {
      const storedKey = window.localStorage.key(i)
      if (!storedKey) continue

      const plainKey = storedKey.startsWith(LS_PREFIX)
        ? storedKey.slice(LS_PREFIX.length)
        : storedKey

      if (!plainKey.startsWith('eu360')) continue

      const raw = window.localStorage.getItem(storedKey)
      const obj = safeParseJSON<any>(raw)
      if (!obj) continue

      out.push({ key: plainKey, obj })
    }
  } catch {}

  return out
}

function buildSnapshot(source: ProfileSource, obj: any): ProfileSnapshot {
  return {
    source,
    motherName: normalizeMotherNameFromAny(obj),
    children: normalizeChildrenFromAny(obj),
    updatedAtISO: normalizeUpdatedAtFromAny(obj),
  }
}

/**
 * API pública — hubs chamam isso.
 */
export function getProfileSnapshot(): ProfileSnapshot {
  // 1) LS primário
  {
    const raw = safeGetLSRaw(LS_PRIMARY)
    const obj = safeParseJSON<any>(raw)
    if (obj) return buildSnapshot('ls_primary', obj)
  }

  // 2) candidatos conhecidos
  for (const k of getKnownCandidates()) {
    if (k === LS_PRIMARY) continue
    const raw = safeGetLSRaw(k)
    const obj = safeParseJSON<any>(raw)
    if (!obj) continue

    // Se for uma lista pura (ex.: eu360_children), embrulha para normalizar
    const wrapped = Array.isArray(obj) ? { children: obj } : obj

    const snap = buildSnapshot('ls_secondary', wrapped)
    if (snap.motherName || snap.children.length) return snap
  }

  // 3) scan por prefixo eu360 (último recurso)
  const scanned = scanEu360Prefixed()
  for (const it of scanned) {
    const wrapped = Array.isArray(it.obj) ? { children: it.obj } : it.obj
    const snap = buildSnapshot('ls_scan', wrapped)
    if (snap.motherName || snap.children.length) return snap
  }

  return {
    source: 'none',
    motherName: null,
    children: [],
    updatedAtISO: null,
  }
}

/**
 * Helpers úteis para hubs.
 */
export function getActiveChildOrNull(preferredChildId?: string | null) {
  const snap = getProfileSnapshot()
  if (!snap.children.length) return null

  if (preferredChildId) {
    const found = snap.children.find((c) => c.id === preferredChildId)
    if (found) return found
  }

  // Preferir quem tem idade preenchida e mais velha (maior ageMonths)
  const withAge = snap.children.filter((c) => typeof c.ageMonths === 'number') as Array<
    ChildSnapshot & { ageMonths: number }
  >
  if (withAge.length) {
    const sorted = [...withAge].sort((a, b) => b.ageMonths - a.ageMonths)
    return sorted[0]
  }

  return snap.children[0]
}
