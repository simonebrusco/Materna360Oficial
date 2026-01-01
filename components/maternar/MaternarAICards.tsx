'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'

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
  return items.map(i => `${i.tag ?? ''}::${i.title}::${i.description ?? ''}`).join('|')
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
 * Fallback alinhado ao Prompt Canônico — MATERNAR
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
      description: 'Dizer “não” pode ser apenas um jeito de proteger o que importa.',
    },
    {
      id: 'fb-5',
      tag: 'cansaço',
      title: 'Quando tudo parece demais, é natural se sentir assim.',
      description: 'Nem sempre cabe tudo — e isso não é falha.',
    },
  ]
}

function normalizeFromEmocional(payload: any): Suggestion[] | null {
  if (!payload?.inspiration) return null

  const { phrase, care, ritual } = payload.inspiration

  const items: Suggestion[] = []

  if (typeof phrase === 'string' && phrase.trim()) {
    items.push({ id: 'inspo-phrase', tag: 'frase', title: phrase.trim() })
  }

  if (typeof care === 'string' && care.trim()) {
    items.push({
      id: 'inspo-care',
      tag: 'cuidado',
      title: 'Um cuidado que acolhe',
      description: care.trim(),
    })
  }

  if (typeof ritual === 'string' && ritual.trim()) {
    items.push({
      id: 'inspo-ritual',
      tag: 'ritual',
      title: 'Um gesto simples de presença',
      description: ritual.trim(),
    })
  }

  return items.length ? items.slice(0, 3) : null
}

function getSavedFromLS(): Suggestion[] {
  const raw = safeGetLS(LS_SAVED_KEY)
  const parsed = safeParse<unknown>(raw)
  if (!Array.isArray(parsed)) return []

  return (parsed as any[])
    .filter(x => x && typeof x.title === 'string')
    .slice(0, 50)
    .map((x, idx) => ({
      id: x.id || `saved-${idx}`,
      title: String(x.title),
      description: x.description ? String(x.description) : undefined,
      tag: x.tag ? String(x.tag) : undefined,
    }))
}

function setSavedToLS(items: Suggestion[]) {
  safeSetLS(LS_SAVED_KEY, JSON.stringify(items.slice(0, 50)))
}

function getDismissedToday(todayKey: string): Record<string, true> {
  const raw = safeGetLS(`${LS_DISMISS_KEY_PREFIX}${todayKey}`)
  const parsed = safeParse<Record<string, true>>(raw)
  return parsed || {}
}

function setDismissedToday(todayKey: string, value: Record<string, true>) {
  safeSetLS(`${LS_DISMISS_KEY_PREFIX}${todayKey}`, JSON.stringify(value))
}

export default function MaternarAICards() {
  const todayKey = useMemo(() => brazilDateKey(new Date()), [])

  const [state, setState] = useState<State>({ status: 'idle' })
  const [saved, setSaved] = useState<Suggestion[]>(getSavedFromLS)
  const [dismissed, setDismissed] = useState<Record<string, true>>(getDismissedToday(todayKey))

  const lastSigRef = useRef('')
  const seedRef = useRef(Date.now())

  const visibleItems = useMemo(
    () => (state.status === 'done' ? state.items.filter(i => !dismissed[i.id]) : []),
    [state, dismissed]
  )

  const dismissOne = (id: string) => {
    const next = { ...dismissed, [id]: true }
    setDismissed(next)
    setDismissedToday(todayKey, next)
  }

  const saveOne = (item: Suggestion) => {
    const next = [{ ...item, id: `saved-${Date.now()}` }, ...saved].slice(0, 50)
    setSaved(next)
    setSavedToLS(next)
    dismissOne(item.id)
  }

  const fetchCards = useCallback(async (attempt = 0) => {
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/ai/emocional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'daily_inspiration',
          origin: 'maternar-hub',
          context: {},
        }),
      })

      const data = res.ok ? await res.json() : null
      const normalized = normalizeFromEmocional(data)
      const items =
        normalized ??
        shuffle(baseFallback(), (seedRef.current += 19)).slice(0, 3)

      const sig = signature(items)
      if (sig === lastSigRef.current && attempt < 1) return fetchCards(attempt + 1)

      lastSigRef.current = sig
      setState({ status: 'done', items })
    } catch {
      const items = shuffle(baseFallback(), (seedRef.current += 31)).slice(0, 3)
      setState({ status: 'done', items })
    }
  }, [])

  return (
    <div className="space-y-4">
      <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center">
              <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold text-[#b8236b]">
                Para agora
              </span>
              <h2 className="text-[16px] md:text-[17px] font-semibold text-[#2f3a56]">
                Um apoio para este momento
              </h2>
              <p className="text-[13px] text-[#6a6a6a]">
                Se fizer sentido, fica. Se não fizer, tudo bem também.
              </p>
            </div>
          </div>

          <Button
            variant={state.status === 'idle' ? 'default' : 'secondary'}
            className="px-4"
            onClick={() => fetchCards()}
          >
            {state.status === 'idle' ? 'Ver um apoio' : 'Ver outro apoio'}
          </Button>
        </div>

        {state.status === 'loading' && (
          <p className="mt-4 text-[13px] text-[#6a6a6a]">Carregando…</p>
        )}

        {state.status === 'done' && (
          <div className="mt-4 space-y-3">
            {visibleItems.map(item => (
              <div key={item.id} className="rounded-2xl border px-4 py-3">
                <span className="text-[10px] font-semibold text-[#b8236b] uppercase">
                  {item.tag}
                </span>
                <p className="mt-1 font-semibold">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-[12px] text-[#6a6a6a]">{item.description}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => dismissOne(item.id)}>Não agora</button>
                  <button onClick={() => saveOne(item)}>Guardar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SoftCard>
    </div>
  )
}
