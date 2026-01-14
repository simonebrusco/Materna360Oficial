export type SuggestionPack = { title: string; description: string }

function hashToSeed(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(arr: T[], seedKey: string): T[] {
  const seed = hashToSeed(seedKey)
  const rand = mulberry32(seed)
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function titleRootKey(title: string) {
  const t = String(title ?? '')
    .replace(/(^|\n)\s*[\u2022\u25CF\u25AA\u25AB\u25E6]\s+/g, '$1')
    .replace(/(^|\n)\s*[-\u2013\u2014]\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\p{Extended_Pictographic}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  const parts = t
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  return parts.slice(0, 2).join(' ')
}

function isTooSimilarTitle(a: string, b: string) {
  const ra = titleRootKey(a)
  const rb = titleRootKey(b)
  if (!ra || !rb) return false
  if (ra === rb) return true
  const a0 = ra.split(' ')[0]
  const b0 = rb.split(' ')[0]
  return Boolean(a0 && b0 && a0 === b0)
}

export function pick3DiverseSuggestions(data: unknown, nonce: string): SuggestionPack[] | null {
  const d = data as { suggestions?: unknown }
  const arr = Array.isArray(d?.suggestions) ? (d.suggestions as any[]) : null
  if (!arr || arr.length < 3) return null

  const all = arr
    .map((s) => ({
      title: String(s?.title ?? '').trim(),
      description: String(s?.description ?? '').trim(),
    }))
    .filter((p) => p.title && p.description)

  if (all.length < 3) return null

  const pool = shuffled(all, `bloco2:${nonce}`)
  const chosen: SuggestionPack[] = []

  for (const cand of pool) {
    if (chosen.length === 0) {
      chosen.push(cand)
      continue
    }
    const clashes = chosen.some((c) => isTooSimilarTitle(c.title, cand.title))
    if (!clashes) chosen.push(cand)
    if (chosen.length === 3) break
  }

  if (chosen.length < 3) {
    for (const cand of pool) {
      if (chosen.length === 3) break
      const already = chosen.some((c) => c.title === cand.title && c.description === cand.description)
      if (!already) chosen.push(cand)
    }
  }

  if (chosen.length < 3) return null
  return [chosen[0], chosen[1], chosen[2]]
}
