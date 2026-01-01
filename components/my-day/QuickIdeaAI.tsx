'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { AISuggestion } from '@/app/lib/ai/orchestrator.types'

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

// P33.4a — sinal emocional (contexto fraco)
const LS_SIGNAL_KEY = 'm360.my_day.last_signal.v1'
type EmotionalSignal = 'heavy' | 'tired' | 'overwhelmed' | 'neutral'

// P33.4b — rotação/autonomia (cache técnico local)
const LS_SEEN_KEY = 'm360.my_day.quick_idea.seen.v1'
const LS_COUNT_KEY = 'm360.my_day.quick_idea.count.v1'
const DAILY_SOFT_BUDGET = 10 // invisível; não bloqueia, apenas relaxa anti-repetição depois disso

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

function normalize(payload: any): Suggestion[] | null {
  if (!payload) return null

  // Formato A: { suggestions: [{id,title,description}] }
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

  // Formato B: { title, body } (legado)
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

function signature(items: Suggestion[]) {
  return items.map((i) => `${i.title}::${i.description ?? ''}`).join('|')
}

function itemKey(i: Suggestion) {
  return `${i.title}::${i.description ?? ''}`.trim()
}

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr]
  let m = a.length
  let s = seed
  while (m) {
    // pseudo-random determinístico por seed
    s = (s * 9301 + 49297) % 233280
    const rnd = s / 233280
    const i = Math.floor(rnd * m--)
    ;[a[m], a[i]] = [a[i], a[m]]
  }
  return a
}

function baseFallback(): Suggestion[] {
  return [
    { id: 'fallback-1', title: 'Respirar por 1 minuto', description: 'Uma pausa curta já ajuda a reorganizar.' },
    { id: 'fallback-2', title: 'Escolher só uma prioridade', description: 'O resto pode esperar.' },
    { id: 'fallback-3', title: 'Fazer algo simples', description: 'Algo pequeno já é suficiente por agora.' },
    { id: 'fallback-4', title: 'Beber um copo de água', description: 'Só para ancorar o corpo no presente.' },
    { id: 'fallback-5', title: 'Pedir ajuda com uma frase', description: 'Uma frase curta já resolve muita coisa.' },
  ]
}

function getSavedFromLS(): Suggestion[] {
  const raw = safeGetLS(LS_SAVED_KEY)
  const parsed = safeParse<unknown>(raw)
  if (!Array.isArray(parsed)) return []
  const items = (parsed as any[])
    .filter((x) => x && typeof x.title === 'string' && x.title.trim())
    .slice(0, 50)
    .map((x, idx) => ({
      id: typeof x.id === 'string' && x.id.trim() ? x.id : `saved-${idx + 1}`,
      title: String(x.title),
      description: typeof x.description === 'string' && x.description.trim() ? String(x.description) : undefined,
    }))
  return items
}

function setSavedToLS(items: Suggestion[]) {
  safeSetLS(LS_SAVED_KEY, JSON.stringify(items.slice(0, 50)))
}

// ===== P33.4b helpers: dia, vistos, orçamento suave =====

function todayKey() {
  // YYYY-MM-DD (local)
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type SeenState = { dayKey: string; seen: string[] }

function getSeenState(): SeenState {
  const raw = safeGetLS(LS_SEEN_KEY)
  const parsed = safeParse<SeenState>(raw)
  const key = todayKey()

  if (!parsed || typeof parsed !== 'object') return { dayKey: key, seen: [] }
  if (parsed.dayKey !== key) return { dayKey: key, seen: [] }
  if (!Array.isArray(parsed.seen)) return { dayKey: key, seen: [] }

  // limit defensivo
  const seen = parsed.seen.filter((s) => typeof s === 'string' && s.trim()).slice(0, 80)
  return { dayKey: key, seen }
}

function setSeenState(next: SeenState) {
  safeSetLS(LS_SEEN_KEY, JSON.stringify({ dayKey: next.dayKey, seen: next.seen.slice(0, 80) }))
}

type CountState = { dayKey: string; count: number }

function getCountState(): CountState {
  const raw = safeGetLS(LS_COUNT_KEY)
  const parsed = safeParse<CountState>(raw)
  const key = todayKey()

  if (!parsed || typeof parsed !== 'object') return { dayKey: key, count: 0 }
  if (parsed.dayKey !== key) return { dayKey: key, count: 0 }
  const count = Number.isFinite(parsed.count) ? Number(parsed.count) : 0
  return { dayKey: key, count: Math.max(0, Math.min(200, count)) }
}

function setCountState(next: CountState) {
  safeSetLS(LS_COUNT_KEY, JSON.stringify({ dayKey: next.dayKey, count: Math.max(0, Math.min(200, next.count)) }))
}

function normalizeSignal(input: unknown): EmotionalSignal {
  switch (input) {
    case 'heavy':
    case 'tired':
    case 'overwhelmed':
    case 'neutral':
      return input
    default:
      return 'neutral'
  }
}

function getSignalFromLS(): EmotionalSignal {
  const raw = safeGetLS(LS_SIGNAL_KEY)
  return normalizeSignal(raw)
}

function filterUnseen(items: Suggestion[], seen: Set<string>) {
  return items.filter((i) => !seen.has(itemKey(i)))
}

function fillToThree(primary: Suggestion[], fallbackSeed: number) {
  if (primary.length >= 3) return primary.slice(0, 3)
  const existing = new Set(primary.map(itemKey))
  const filler = shuffle(baseFallback(), fallbackSeed)
    .filter((x) => !existing.has(itemKey(x)))
    .slice(0, 3 - primary.length)
  return [...primary, ...filler].slice(0, 3)
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

    // P33.4b: orçamento suave por dia (invisível)
    const countState = getCountState()
    const nextCount = countState.count + 1
    setCountState({ dayKey: countState.dayKey, count: nextCount })

    // Quanto mais “pede outra”, mais relaxamos a anti-repetição (sem bloquear).
    const strictRotation = nextCount <= DAILY_SOFT_BUDGET

    // P33.4b: vistos do dia (cache técnico)
    const seenState = getSeenState()
    const seenSet = new Set(seenState.seen)

    // P33.4a: sinal emocional como contexto fraco
    const emotionalSignal = getSignalFromLS()

    try {
      // POST (preferido)
      const postRes = await fetch('/api/ai/quick-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intent: 'quick_idea',
          nonce,
          memory: { emotional_signal: emotionalSignal },
        }),
        cache: 'no-store',
      })

      let data: any = null

      if (postRes.ok) {
        data = await postRes.json().catch(() => null)
      } else {
        // GET (fallback), com query pra evitar cache
        const getRes = await fetch(`/api/ai/quick-ideas?nonce=${nonce}`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (getRes.ok) data = await getRes.json().catch(() => null)
      }

      const normalized = normalize(data)

      // Se não veio nada utilizável, usa fallback embaralhado
      const rawItems =
        normalized ??
        shuffle(baseFallback(), (fallbackSeedRef.current = fallbackSeedRef.current + 17)).slice(0, 3)

      // P33.4b: anti-repetição invisível (quando ainda “vale” manter variedade)
      const candidates = strictRotation ? filterUnseen(rawItems, seenSet) : rawItems

      // Se ficou fraco demais (ex.: 1 item sobrando) e ainda não tentamos, tenta mais uma vez
      // para evitar sensação de “travado”, mas sem loop infinito.
      if (strictRotation && candidates.length < 3 && attempt < 1) {
        return await run(attempt + 1)
      }

      // Completa para 3, sem inventar UX; apenas evita silêncio
      const nextItems = fillToThree(
        candidates.length ? candidates : rawItems,
        (fallbackSeedRef.current = fallbackSeedRef.current + 19)
      )

      const sig = signature(nextItems)

      // Se repetiu exatamente e ainda não tentou (e ainda estamos em rotação “estrita”), tenta mais uma vez
      if (strictRotation && sig && sig === lastSigRef.current && attempt < 1) {
        return await run(attempt + 1)
      }

      lastSigRef.current = sig

      // P33.4b: marca como vistos do dia (cache técnico)
      const nextSeen = [...seenState.seen]
      for (const it of nextItems) {
        const k = itemKey(it)
        if (k && !nextSeen.includes(k)) nextSeen.unshift(k)
      }
      setSeenState({ dayKey: seenState.dayKey, seen: nextSeen.slice(0, 80) })

      // Reseta “dismissed” a cada nova rodada para não “sumir tudo”
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    } catch {
      const rawItems = shuffle(
        baseFallback(),
        (fallbackSeedRef.current = fallbackSeedRef.current + 23)
      ).slice(0, 3)

      const candidates = strictRotation ? filterUnseen(rawItems, seenSet) : rawItems

      if (strictRotation && candidates.length < 3 && attempt < 1) {
        return await run(attempt + 1)
      }

      const nextItems = fillToThree(
        candidates.length ? candidates : rawItems,
        (fallbackSeedRef.current = fallbackSeedRef.current + 29)
      )

      const sig = signature(nextItems)

      if (strictRotation && sig && sig === lastSigRef.current && attempt < 1) {
        return await run(attempt + 1)
      }

      lastSigRef.current = sig

      const nextSeen = [...seenState.seen]
      for (const it of nextItems) {
        const k = itemKey(it)
        if (k && !nextSeen.includes(k)) nextSeen.unshift(k)
      }
      setSeenState({ dayKey: seenState.dayKey, seen: nextSeen.slice(0, 80) })

      setDismissed({})
      setState({ status: 'done', items: nextItems })
    }
  }, [])

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => ({ ...prev, [id]: true }))
  }, [])

  const saveOne = useCallback(
    (item: Suggestion) => {
      // não duplica por title+description
      const key = `${item.title}::${item.description ?? ''}`.trim()
      const exists = saved.some((s) => `${s.title}::${s.description ?? ''}`.trim() === key)
      if (exists) return

      const next = [{ ...item, id: `saved-${Date.now()}` }, ...saved].slice(0, 50)
      setSaved(next)
      setSavedToLS(next)
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
            <span className="text-[14px] font-semibold">Me dá uma ideia rápida</span>
            <span className="h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
              <AppIcon name="sparkles" size={18} className="text-[#fd2597]" />
            </span>
          </button>
        ) : null}

        {state.status === 'loading' ? (
          <p className="text-[13px] text-[#6A6A6A]">Pensando em algo simples…</p>
        ) : null}

        {state.status === 'done' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#6A6A6A]">Ideias simples para agora</p>

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
