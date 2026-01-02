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
  ]
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

  const fetchCards = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const res = await fetch(`/api/ai/emocional`, {
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

      const nextItems =
        data?.items ??
        shuffle(baseFallback(), (seedRef.current = seedRef.current + 17)).slice(0, 3)

      const sig = signature(nextItems)
      if (sig === lastSigRef.current) return

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    } catch {
      const nextItems = shuffle(baseFallback(), (seedRef.current = seedRef.current + 23)).slice(0, 3)
      lastSigRef.current = signature(nextItems)
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    }
  }, [])

  const isEmbedded = variant === 'embedded'

  return (
    <SoftCard
      className={[
        `
          rounded-2xl
          bg-white
          border border-black/5
          ${isEmbedded ? 'p-4 shadow-none' : 'p-5 md:p-6 shadow-[0_6px_18px_rgba(0,0,0,0.06)]'}
        `,
        className ?? '',
      ].join(' ')}
    >
      {/* CABEÇALHO — SOMENTE NO STANDALONE */}
      {!isEmbedded && (
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
            <Button className="px-4" onClick={() => void fetchCards()}>
              Ver sugestões
            </Button>
          </div>
        </div>
      )}

      {/* CTA DISCRETO — EMBUTIDO */}
      {isEmbedded && state.status === 'idle' && (
        <Button variant="secondary" className="mb-3 px-4" onClick={() => void fetchCards()}>
          Ver um apoio possível agora
        </Button>
      )}

      {state.status === 'loading' && (
        <div className="mt-2 text-[13px] text-black/60">Carregando…</div>
      )}

      {state.status === 'done' && (
        <div className="mt-3 space-y-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-black/5 bg-white px-4 py-3">
              {item.tag && (
                <span className="inline-flex rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-black/70 uppercase">
                  {item.tag}
                </span>
              )}
              <p className="mt-1 text-[14px] font-semibold text-black/80">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-[12px] text-black/60 leading-relaxed">{item.description}</p>
              )}

              <button
                type="button"
                onClick={() => dismissOne(item.id)}
                className="mt-2 text-[12px] text-black/60 hover:underline"
              >
                Não agora
              </button>
            </div>
          ))}
        </div>
      )}
    </SoftCard>
  )
}
