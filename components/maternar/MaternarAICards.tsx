'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { MY_DAY_SOURCES, addTaskToMyDayAndTrack } from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'

type Suggestion = {
  id: string
  title: string
  description?: string
  tag?: string
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: Suggestion[] }

const LS_SAVED_KEY = 'm360.ai.maternar_cards.saved.v1'
const LS_DISMISS_KEY_PREFIX = 'm360.ai.maternar_cards.dismissed.' // + dateKey

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

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function brazilDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function signature(items: Suggestion[]) {
  return items.map((i) => `${i.tag ?? ''}::${i.title}::${i.description ?? ''}`).join('|')
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
 * Fallback alinhado ao Prompt Canônico — MATERNAR:
 * acolhe, nomeia, normaliza e fecha sem tarefa.
 */
function baseFallback(): Suggestion[] {
  return [
    {
      id: 'fb-1',
      tag: 'frase',
      title: 'Hoje, o suficiente já é muito.',
      description: 'Sem corrida. Sem dívida emocional. Só presença possível.',
    },
    {
      id: 'fb-2',
      tag: 'cuidado',
      title: 'Você não precisa estar “bem” para merecer cuidado.',
      description: 'Quando o dia pesa, o corpo e o coração só pedem um pouco de gentileza.',
    },
    {
      id: 'fb-3',
      tag: 'ritual',
      title: 'Às vezes, o que falta não é força.',
      description: 'É só um pouco de respiro, do jeito que der.',
    },
    {
      id: 'fb-4',
      tag: 'limites',
      title: 'Limites também podem ser amor.',
      description: 'Dizer “não” pode ser um jeito de proteger o que importa — sem culpa.',
    },
    {
      id: 'fb-5',
      tag: 'cansaço',
      title: 'Quando tudo parece demais, é comum se sentir assim.',
      description: 'Nem sempre cabe tudo — e isso não é falha.',
    },
  ]
}

function normalizeFromEmocional(payload: any): Suggestion[] | null {
  if (!payload) return null

  // Schema: { inspiration: { phrase, care, ritual } }
  if (payload?.inspiration) {
    const phrase = typeof payload.inspiration.phrase === 'string' ? payload.inspiration.phrase.trim() : ''
    const care = typeof payload.inspiration.care === 'string' ? payload.inspiration.care.trim() : ''
    const ritual = typeof payload.inspiration.ritual === 'string' ? payload.inspiration.ritual.trim() : ''

    const items: Suggestion[] = []

    if (phrase) {
      items.push({ id: 'inspo-phrase', tag: 'frase', title: phrase })
    }

    if (care) {
      items.push({
        id: 'inspo-care',
        tag: 'cuidado',
        title: 'Um cuidado que acolhe',
        description: care,
      })
    }

    if (ritual) {
      items.push({
        id: 'inspo-ritual',
        tag: 'ritual',
        title: 'Um gesto simples de presença',
        description: ritual,
      })
    }

    return items.length ? items.slice(0, 3) : null
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
      id: typeof x.id === 'string' && x.id.trim() ? x.id : `saved-${idx + 1}`,
      title: String(x.title),
      description: typeof x.description === 'string' && x.description.trim() ? String(x.description) : undefined,
      tag: typeof x.tag === 'string' && x.tag.trim() ? String(x.tag) : undefined,
    }))
  return items
}

function setSavedToLS(items: Suggestion[]) {
  safeSetLS(LS_SAVED_KEY, JSON.stringify(items.slice(0, 50)))
}

function getDismissedToday(todayKey: string): Record<string, true> {
  const raw = safeGetLS(`${LS_DISMISS_KEY_PREFIX}${todayKey}`)
  const parsed = safeParse<Record<string, true>>(raw)
  return parsed && typeof parsed === 'object' ? parsed : {}
}

function setDismissedToday(todayKey: string, value: Record<string, true>) {
  safeSetLS(`${LS_DISMISS_KEY_PREFIX}${todayKey}`, JSON.stringify(value))
}

export default function MaternarAICards() {
  const todayKey = useMemo(() => brazilDateKey(new Date()), [])

  const [state, setState] = useState<State>(() => ({ status: 'idle' }))
  const [saved, setSaved] = useState<Suggestion[]>(() => getSavedFromLS())
  const [dismissed, setDismissed] = useState<Record<string, true>>(() => getDismissedToday(todayKey))

  const lastSigRef = useRef<string>('')
  const seedRef = useRef<number>(Date.now())

  const visibleItems = useMemo(() => {
    if (state.status !== 'done') return []
    return state.items.filter((i) => !dismissed[i.id])
  }, [state, dismissed])

  const persistDismiss = useCallback(
    (next: Record<string, true>) => {
      setDismissed(next)
      setDismissedToday(todayKey, next)
    },
    [todayKey]
  )

  const dismissOne = useCallback(
    (id: string) => {
      // FIX TS: preservar Record<string, true>
      const next: Record<string, true> = { ...dismissed, [id]: true as true }
      persistDismiss(next)
    },
    [dismissed, persistDismiss]
  )

  const saveOne = useCallback(
    (item: Suggestion) => {
      const key = `${item.tag ?? ''}::${item.title}::${item.description ?? ''}`.trim()
      const exists = saved.some((s) => `${s.tag ?? ''}::${s.title}::${s.description ?? ''}`.trim() === key)
      if (exists) {
        dismissOne(item.id)
        return
      }

      // 1) mantém comportamento atual do Maternar (guardadas)
      const next = [{ ...item, id: `saved-${Date.now()}` }, ...saved].slice(0, 50)
      setSaved(next)
      setSavedToLS(next)

      // 2) P33.5a — conexão indireta e opcional com Meu Dia (silenciosa)
      try {
        const title = (item.title ?? '').trim()
        if (title) {
          addTaskToMyDayAndTrack({
            title,
            origin: 'selfcare',
            source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
          })

          // marca continuidade para o Meu Dia abrir no grupo certo (sem CTA / sem navegação)
          markRecentMyDaySave({
            origin: 'selfcare',
            source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
          })
        }
      } catch {
        // nunca quebrar fluxo do Maternar
      }

      // 3) fecha o item da leva atual (permite “não agora” implícito)
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

  const fetchCards = useCallback(async (attempt = 0) => {
    setState({ status: 'loading' })

    const nonce = Date.now()

    try {
      const res = await fetch(`/api/ai/emocional?nonce=${nonce}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'daily_inspiration',
          origin: 'maternar-hub',
          context: {},
        }),
      })

      let data: any = null
      if (res.ok) data = await res.json().catch(() => null)

      const normalized = normalizeFromEmocional(data)
      const nextItems = normalized ?? shuffle(baseFallback(), (seedRef.current = seedRef.current + 19)).slice(0, 3)

      const sig = signature(nextItems)

      if (sig && sig === lastSigRef.current && attempt < 1) {
        return await fetchCards(attempt + 1)
      }

      lastSigRef.current = sig
      setState({ status: 'done', items: nextItems })
    } catch {
      const nextItems = shuffle(baseFallback(), (seedRef.current = seedRef.current + 31)).slice(0, 3)
      const sig = signature(nextItems)

      if (sig && sig === lastSigRef.current && attempt < 1) {
        return await fetchCards(attempt + 1)
      }

      lastSigRef.current = sig
      setState({ status: 'done', items: nextItems })
    }
  }, [])

  return (
    <div className="space-y-4">
      <SoftCard
        className="
          p-5 md:p-6 rounded-2xl
          bg-white/95
          border border-[#f5d7e5]
          shadow-[0_6px_18px_rgba(184,35,107,0.09)]
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
              <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                Para agora
              </span>
              <h2 className="text-[16px] md:text-[17px] font-semibold text-[#2f3a56]">
                Um apoio para este momento
              </h2>
              <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                Se fizer sentido, fica. Se não fizer, tudo bem também.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {state.status === 'idle' ? (
              <Button className="px-4" onClick={() => void fetchCards()}>
                Ver sugestões
              </Button>
            ) : (
              <Button variant="secondary" className="px-4" onClick={() => void fetchCards()}>
                Ver outro apoio
              </Button>
            )}
          </div>
        </div>

        {state.status === 'loading' ? (
          <div className="mt-4 rounded-2xl border border-[#f5d7e5]/70 bg-white px-4 py-3">
            <p className="text-[13px] text-[#6a6a6a]">Carregando…</p>
          </div>
        ) : null}

        {state.status === 'done' ? (
          <div className="mt-4 space-y-3">
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#f5d7e5]/70 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {item.tag ? (
                        <span className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
                          {item.tag}
                        </span>
                      ) : null}

                      <p className="mt-1 text-[14px] font-semibold text-[#2f3a56]">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed whitespace-pre-line">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="
                          rounded-full
                          bg-white
                          border border-[#f5d7e5]/70
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
              ))
            ) : (
              <div className="rounded-2xl border border-[#f5d7e5]/70 bg-white px-4 py-3">
                <p className="text-[13px] text-[#6a6a6a]">Sem pressão. Se quiser, peça outra leva.</p>
              </div>
            )}
          </div>
        ) : null}
      </SoftCard>

      {saved.length ? (
        <SoftCard
          className="
            p-5 md:p-6 rounded-2xl
            bg-white/95
            border border-[#f5d7e5]
            shadow-[0_6px_18px_rgba(184,35,107,0.09)]
          "
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
              <AppIcon name="bookmark" size={20} className="text-[#fd2597]" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                Guardadas
              </span>
              <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                Só para você. Sem virar tarefa, sem virar cobrança.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {saved.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="
                  rounded-2xl
                  border border-[#f5d7e5]/50
                  bg-white
                  px-4 py-3
                  flex items-start justify-between gap-3
                "
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#2f3a56]">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#6a6a6a] hover:opacity-90 transition whitespace-nowrap"
                  onClick={() => removeSaved(item.id)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          {saved.length > 3 ? (
            <p className="mt-3 text-[12px] text-[#6a6a6a]">Você tem mais ideias guardadas — quando quiser, elas ficam aqui.</p>
          ) : null}

          <div className="mt-3">
            <button
              type="button"
              className="text-[12px] font-semibold text-[#fd2597] hover:opacity-90 transition"
              onClick={() => {
                setSaved([])
                setSavedToLS([])
              }}
            >
              Limpar guardadas
            </button>
          </div>
        </SoftCard>
      ) : null}

      {/* higiene: botão invisível (sem UI) para eventual reset manual no futuro */}
      <button
        type="button"
        className="hidden"
        onClick={() => safeRemoveLS(`${LS_DISMISS_KEY_PREFIX}${todayKey}`)}
        aria-hidden="true"
      />
    </div>
  )
}
