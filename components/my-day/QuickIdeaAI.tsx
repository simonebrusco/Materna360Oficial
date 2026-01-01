'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'

type Suggestion = {
  id: string
  title: string
  description?: string
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: Suggestion[] }

const LS_SAVED_KEY = 'm360.ai.quick_ideas.saved.v1'

// Memória contextual suave (não é “perfil”, é só histórico local)
const LS_MEMORY_KEY = 'm360.ai.quick_ideas.memory.v1'
const MEMORY_MAX_SEEN = 20
const MEMORY_MAX_DISMISSED = 30
const DISMISS_TTL_DAYS = 7

type MemoryState = {
  seen: Array<{ id: string; at: number }>
  dismissed: Array<{ id: string; at: number }>
  savedIds: string[]
}

function nowMs() {
  return Date.now()
}

function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

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

function getTodBucket() {
  const h = new Date().getHours()
  if (h >= 5 && h <= 11) return 'morning'
  if (h >= 12 && h <= 17) return 'afternoon'
  return 'night'
}

function baseFallback(): Suggestion[] {
  return [
    { id: 'fallback-1', title: 'Respirar por 1 minuto', description: 'Só para o corpo voltar para o presente.' },
    { id: 'fallback-2', title: 'Escolher uma coisa pequena', description: 'Uma só. O resto pode esperar.' },
    { id: 'fallback-3', title: 'Fazer o próximo passo mais simples', description: 'Bem simples — só para destravar.' },
    { id: 'fallback-4', title: 'Beber um copo de água', description: 'Uma âncora rápida para agora.' },
    { id: 'fallback-5', title: 'Pedir ajuda com uma frase curta', description: 'Uma frase resolve mais do que parece.' },
  ]
}

function signature(items: Suggestion[]) {
  return items.map((i) => `${i.title}::${i.description ?? ''}`).join('|')
}

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr]
  let m = a.length
  let s = seed
  while (m) {
    s = (s * 9301 + 49297) % 233280
    const rnd = s / 233280
    const i = Math.floor(rnd * m--)
    ;[a[m], a[i]] = [a[i], a[m]]
  }
  return a
}

/**
 * Normaliza múltiplos formatos de resposta:
 * - Formato leve (Meu Dia):   { suggestions: [{id,title,description}] }
 * - Formato legado (catálogo): { access, ideas: [{id,title,summary,...}] }
 * - Formato alternativo:      { title/body }
 */
function normalize(payload: any): Suggestion[] | null {
  if (!payload) return null

  // Formato leve: { suggestions: [...] }
  if (Array.isArray(payload?.suggestions)) {
    const items = payload.suggestions
      .filter((x: any) => x && typeof x.title === 'string' && x.title.trim())
      .slice(0, 3)
      .map((x: any, idx: number) => ({
        id: typeof x.id === 'string' && x.id.trim() ? x.id : `ai-${idx + 1}`,
        title: String(x.title),
        description: typeof x.description === 'string' && x.description.trim() ? String(x.description) : undefined,
      }))
    return items.length ? items : null
  }

  // Formato legado: { ideas: [...] }
  if (Array.isArray(payload?.ideas)) {
    const items = payload.ideas
      .filter((x: any) => x && typeof x.title === 'string' && x.title.trim())
      .slice(0, 3)
      .map((x: any, idx: number) => ({
        id: typeof x.id === 'string' && x.id.trim() ? x.id : `ai-${idx + 1}`,
        title: String(x.title),
        description:
          typeof x.summary === 'string' && x.summary.trim()
            ? String(x.summary)
            : typeof x.description === 'string' && x.description.trim()
              ? String(x.description)
              : undefined,
      }))
    return items.length ? items : null
  }

  // Formato alternativo: { title, body }
  if (typeof payload?.title === 'string' || typeof payload?.body === 'string') {
    const raw = String(payload?.body ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3)

    const items = (raw.length ? raw : [payload?.title].filter(Boolean))
      .slice(0, 3)
      .map((line: any, idx: number) => ({
        id: `ai-${idx + 1}`,
        title: String(line),
      }))

    return items.length ? items : null
  }

  return null
}

function getSavedFromLS(): Suggestion[] {
  const raw = safeGetLS(LS_SAVED_KEY)
  const parsed = safeParse<unknown>(raw)
  if (!Array.isArray(parsed)) return []
  const items = (parsed as any[])
    .filter((x) => x && typeof x.title === 'string' && x.title.trim())
    .slice(0, 50)
    .map((x, idx) => ({
      id: typeof (x as any).id === 'string' && String((x as any).id).trim() ? String((x as any).id) : `saved-${idx + 1}`,
      title: String((x as any).title),
      description:
        typeof (x as any).description === 'string' && String((x as any).description).trim()
          ? String((x as any).description)
          : undefined,
    }))
  return items
}

function setSavedToLS(items: Suggestion[]) {
  safeSetLS(LS_SAVED_KEY, JSON.stringify(items.slice(0, 50)))
}

function getMemoryFromLS(): MemoryState {
  const raw = safeGetLS(LS_MEMORY_KEY)
  const parsed = safeParse<unknown>(raw)

  const fallback: MemoryState = { seen: [], dismissed: [], savedIds: [] }
  if (!parsed || typeof parsed !== 'object') return fallback

  const p = parsed as any
  const seen = Array.isArray(p.seen) ? p.seen : []
  const dismissed = Array.isArray(p.dismissed) ? p.dismissed : []
  const savedIds = Array.isArray(p.savedIds) ? p.savedIds : []

  return {
    seen: seen
      .filter((x: any) => x && typeof x.id === 'string' && typeof x.at === 'number')
      .slice(-MEMORY_MAX_SEEN),
    dismissed: dismissed
      .filter((x: any) => x && typeof x.id === 'string' && typeof x.at === 'number')
      .slice(-MEMORY_MAX_DISMISSED),
    savedIds: savedIds.filter((x: any) => typeof x === 'string').slice(0, 50),
  }
}

function setMemoryToLS(mem: MemoryState) {
  safeSetLS(LS_MEMORY_KEY, JSON.stringify(mem))
}

function pruneMemory(mem: MemoryState) {
  const cutoff = nowMs() - daysToMs(DISMISS_TTL_DAYS)
  const dismissed = mem.dismissed.filter((x) => x.at >= cutoff)

  return {
    ...mem,
    seen: mem.seen.slice(-MEMORY_MAX_SEEN),
    dismissed: dismissed.slice(-MEMORY_MAX_DISMISSED),
    savedIds: mem.savedIds.slice(0, 50),
  }
}

function touchSeen(mem: MemoryState, ids: string[]) {
  const t = nowMs()
  const next = {
    ...mem,
    seen: [...mem.seen, ...ids.map((id) => ({ id, at: t }))].slice(-MEMORY_MAX_SEEN),
  }
  return pruneMemory(next)
}

function touchDismissed(mem: MemoryState, id: string) {
  const t = nowMs()
  const next = {
    ...mem,
    dismissed: [...mem.dismissed.filter((x) => x.id !== id), { id, at: t }].slice(-MEMORY_MAX_DISMISSED),
  }
  return pruneMemory(next)
}

export default function QuickIdeaAI() {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [dismissed, setDismissed] = useState<Record<string, true>>({})
  const [saved, setSaved] = useState<Suggestion[]>(() => getSavedFromLS())

  const lastSigRef = useRef<string>('')
  const fallbackSeedRef = useRef<number>(Date.now())

  const visibleItems = useMemo(() => {
    if (state.status !== 'done') return []
    return state.items.filter((i) => !dismissed[i.id])
  }, [state, dismissed])

  const run = useCallback(async (attempt = 0) => {
    setState({ status: 'loading' })

    const nonce = Date.now()

    const mem = pruneMemory(getMemoryFromLS())
    const tod = getTodBucket()
    const dow = new Date().getDay()
    const tz_offset_min = new Date().getTimezoneOffset()

    const payload = {
      intent: 'quick_idea',
      nonce,
      locale: 'pt-BR',
      memory: {
        // “suave”: só IDs e contexto automático
        seen_ids: mem.seen.map((x) => x.id),
        dismissed_ids: mem.dismissed.map((x) => x.id),
        saved_ids: mem.savedIds,
        tod,
        dow,
        tz_offset_min,
      },
    } as const

    try {
      const postRes = await fetch('/api/ai/quick-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      let data: any = null
      if (postRes.ok) {
        data = await postRes.json().catch(() => null)
      } else {
        const getRes = await fetch(`/api/ai/quick-ideas?nonce=${nonce}`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (getRes.ok) data = await getRes.json().catch(() => null)
      }

      const normalized = normalize(data)
      const nextItems =
        normalized ??
        shuffle(baseFallback(), (fallbackSeedRef.current = fallbackSeedRef.current + 17)).slice(0, 1)

      const sig = signature(nextItems)

      if (sig && sig === lastSigRef.current && attempt < 1) {
        return await run(attempt + 1)
      }

      // Atualiza memória: “viu”
      const nextMem = touchSeen(mem, nextItems.map((x) => x.id))
      setMemoryToLS(nextMem)

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    } catch {
      const nextItems = shuffle(baseFallback(), (fallbackSeedRef.current = fallbackSeedRef.current + 23)).slice(0, 1)
      const sig = signature(nextItems)

      if (sig && sig === lastSigRef.current && attempt < 1) {
        return await run(attempt + 1)
      }

      const mem = pruneMemory(getMemoryFromLS())
      const nextMem = touchSeen(mem, nextItems.map((x) => x.id))
      setMemoryToLS(nextMem)

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    }
  }, [])

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => ({ ...prev, [id]: true }))

    const mem = pruneMemory(getMemoryFromLS())
    setMemoryToLS(touchDismissed(mem, id))
  }, [])

  const saveOne = useCallback(
    (item: Suggestion) => {
      const key = `${item.title}::${item.description ?? ''}`.trim()
      const exists = saved.some((s) => `${s.title}::${s.description ?? ''}`.trim() === key)
      if (exists) return

      const next = [{ ...item, id: `saved-${Date.now()}` }, ...saved].slice(0, 50)
      setSaved(next)
      setSavedToLS(next)

      const mem = pruneMemory(getMemoryFromLS())
      const savedIds = Array.from(new Set([item.id, ...mem.savedIds])).slice(0, 50)
      setMemoryToLS({ ...mem, savedIds })

      dismissOne(item.id)
    },
    [saved, dismissOne]
  )

  const removeSaved = useCallback(
    (id: string) => {
      const next = saved.filter((s) => s.id !== id)
      setSaved(next)
      setSavedToLS(next)
    },
    [saved]
  )

  return (
    <div className="mt-6 md:mt-8">
      <div
        className="
          bg-white
          rounded-3xl
          p-5 md:p-6
          shadow-[0_6px_22px_rgba(0,0,0,0.06)]
          border border-[#F5D7E5]
        "
      >
        {state.status === 'idle' ? (
          <button
            type="button"
            className="
              w-full
              flex items-center justify-between
              gap-3
              rounded-2xl
              px-4 py-3
              bg-white
              border border-[#F5D7E5]/70
              text-[#2f3a56]
              hover:shadow-sm
              transition
            "
            onClick={() => void run()}
          >
            <span className="text-[14px] font-semibold">Me dá uma ideia simples para agora</span>
            <span className="h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
              <AppIcon name="sparkles" size={18} className="text-[#fd2597]" />
            </span>
          </button>
        ) : null}

        {state.status === 'loading' ? (
          <p className="text-[13px] text-[#6A6A6A]">Pensando em algo leve…</p>
        ) : null}

        {state.status === 'done' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#6A6A6A]">Ideias simples para este momento</p>

              <button
                type="button"
                className="text-[12px] font-semibold text-[#fd2597] hover:opacity-90 transition"
                onClick={() => void run()}
              >
                Outra ideia
              </button>
            </div>

            {visibleItems.length ? (
              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="
                      rounded-2xl
                      border border-[#F5D7E5]/70
                      bg-white
                      px-4 py-3
                    "
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#2f3a56]">{item.title}</p>
                        {item.description ? (
                          <p className="mt-1 text-[12px] text-[#6A6A6A] leading-relaxed">{item.description}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="
                            rounded-full
                            bg-white
                            border border-[#F5D7E5]/70
                            text-[#545454]
                            px-3 py-1.5
                            text-[12px]
                            transition
                            hover:shadow-sm
                            whitespace-nowrap
                          "
                          onClick={() => dismissOne(item.id)}
                        >
                          Não agora
                        </button>

                        <button
                          type="button"
                          className="
                            rounded-full
                            bg-[#fd2597]
                            text-white
                            px-3 py-1.5
                            text-[12px]
                            font-semibold
                            transition
                            hover:opacity-95
                            whitespace-nowrap
                          "
                          onClick={() => saveOne(item)}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#F5D7E5]/70 bg-white px-4 py-3">
                <p className="text-[13px] text-[#6A6A6A]">Sem pressão. Se quiser, peça outra ideia.</p>
              </div>
            )}

            {saved.length ? (
              <div className="pt-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] text-[#6A6A6A]">Guardadas</p>
                </div>

                <div className="mt-2 space-y-2">
                  {saved.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="
                        rounded-2xl
                        border border-[#F5D7E5]/50
                        bg-white
                        px-4 py-3
                        flex items-start justify-between gap-3
                      "
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#2f3a56]">{item.title}</p>
                        {item.description ? (
                          <p className="mt-1 text-[12px] text-[#6A6A6A] leading-relaxed">{item.description}</p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="text-[12px] font-semibold text-[#6A6A6A] hover:opacity-90 transition whitespace-nowrap"
                        onClick={() => removeSaved(item.id)}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                {saved.length > 3 ? (
                  <p className="mt-2 text-[12px] text-[#6A6A6A]">
                    Você tem mais ideias guardadas — quando quiser, elas ficam aqui.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
