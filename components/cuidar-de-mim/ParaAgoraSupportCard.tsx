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

type Variant = 'standalone' | 'embedded'

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

    if (phrase) items.push({ id: 'inspo-phrase', tag: 'frase', title: phrase })

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

export default function ParaAgoraSupportCard({
  variant = 'standalone',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [dismissed, setDismissed] = useState<Record<string, true>>({})

  const lastSigRef = useRef<string>('')
  const seedRef = useRef<number>(Date.now())

  const visibleItems = useMemo(() => {
    if (state.status !== 'done') return []
    return state.items.filter((i) => !dismissed[i.id])
  }, [state, dismissed])

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => ({ ...prev, [id]: true }))
  }, [])

  const fetchCards = useCallback(
    async (attempt = 0) => {
      setState({ status: 'loading' })
      const nonce = Date.now()

      try {
        const res = await fetch(`/api/ai/emocional?nonce=${nonce}`, {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'daily_inspiration',
            origin: 'cuidar-de-mim',
            context: {},
          }),
        })

        let data: any = null
        if (res.ok) data = await res.json().catch(() => null)

        const normalized = normalizeFromEmocional(data)
        const nextItems =
          normalized ?? shuffle(baseFallback(), (seedRef.current = seedRef.current + 19)).slice(0, 3)

        const sig = signature(nextItems)
        if (sig && sig === lastSigRef.current && attempt < 1) {
          return await fetchCards(attempt + 1)
        }

        lastSigRef.current = sig
        setDismissed({})
        setState({ status: 'done', items: nextItems })
      } catch {
        const nextItems = shuffle(baseFallback(), (seedRef.current = seedRef.current + 31)).slice(0, 3)
        const sig = signature(nextItems)

        if (sig && sig === lastSigRef.current && attempt < 1) {
          return await fetchCards(attempt + 1)
        }

        lastSigRef.current = sig
        setDismissed({})
        setState({ status: 'done', items: nextItems })
      }
    },
    []
  )

  const isEmbedded = variant === 'embedded'

  return (
    <SoftCard
      className={[
        `
          rounded-2xl
          ${isEmbedded ? 'h-full flex flex-col p-4 md:p-5' : 'p-5 md:p-6'}
          ${
            isEmbedded
              ? 'bg-white/70 backdrop-blur border border-[#f5d7e5]/70 shadow-[0_6px_18px_rgba(0,0,0,0.04)]'
              : 'bg-white border border-black/5 shadow-[0_6px_18px_rgba(0,0,0,0.06)]'
          }
        `,
        className ?? '',
      ].join(' ')}
    >
      {/* CABEÇALHO — SOMENTE NO STANDALONE */}
      {!isEmbedded ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
              <AppIcon name="sparkles" size={20} className="text-black/70" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-black/70">
                Para agora
              </span>
              <h3 className="text-[16px] md:text-[17px] font-semibold text-black/85">
                Um apoio para este momento
              </h3>
              <p className="text-[13px] text-black/60 leading-relaxed">
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
      ) : null}

      {/* EMBEDDED — IDLE centralizado (para não “tortar” no grid) */}
      {isEmbedded && state.status === 'idle' ? (
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="secondary"
            className="w-full h-11 rounded-full justify-center border border-[#f5d7e5] bg-white/70 hover:bg-white/80"
            onClick={() => void fetchCards()}
          >
            Ver um apoio possível agora
          </Button>
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <div className="mt-3 rounded-2xl border border-[#f5d7e5]/70 bg-white/70 px-4 py-3">
          <p className="text-[13px] text-[#6a6a6a]">Carregando…</p>
        </div>
      ) : null}

      {state.status === 'done' ? (
        <div className="mt-3 space-y-3">
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#f5d7e5]/70 bg-white/70 px-4 py-3">
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

                  <button
                    type="button"
                    className="
                      rounded-full
                      bg-white/80
                      border border-[#f5d7e5]
                      text-[#545454]
                      px-3 py-1.5
                      text-[12px]
                      transition
                      hover:bg-white
                      whitespace-nowrap
                    "
                    onClick={() => dismissOne(item.id)}
                  >
                    Não agora
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[#f5d7e5]/70 bg-white/70 px-4 py-3">
              <p className="text-[13px] text-[#6a6a6a]">Sem pressão. Se quiser, peça outra leva.</p>
            </div>
          )}
        </div>
      ) : null}
    </SoftCard>
  )
}
