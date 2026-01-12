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

type Variant = 'default' | 'embedded'

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
  className,
  variant = 'default',
}: {
  className?: string
  variant?: Variant
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
          origin: 'cuidar-de-mim',
          context: {},
        }),
      })

      let data: any = null
      if (res.ok) data = await res.json().catch(() => null)

      const normalized = normalizeFromEmocional(data)
      const nextItems = (normalized ?? shuffle(baseFallback(), (seedRef.current = seedRef.current + 19))).slice(0, 3)

      const sig = signature(nextItems)
      if (sig && sig === lastSigRef.current && attempt < 1) return await fetchCards(attempt + 1)

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    } catch {
      const nextItems = shuffle(baseFallback(), (seedRef.current = seedRef.current + 31)).slice(0, 3)
      const sig = signature(nextItems)

      if (sig && sig === lastSigRef.current && attempt < 1) return await fetchCards(attempt + 1)

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    }
  }, [])

  const isEmbedded = variant === 'embedded'
  const headerTitle = isEmbedded ? 'Um respiro para agora' : 'Um apoio para este momento'

  // ✅ COPY FINAL — botões e subtítulo (3 alterações)
  const primaryButtonLabel = state.status === 'idle' ? 'Ver 3 apoios' : 'Ver outros 3'
  const subtitleText = 'Leia com calma. Se algo tocar, fique. Se não, siga o dia.'
  const dismissLabel = 'Fechar este'

  const shellClass = isEmbedded
    ? `
      h-full
      p-5 md:p-6 rounded-2xl
      bg-white/60 backdrop-blur
      border border-[#f5d7e5]/70
      shadow-[0_10px_26px_rgba(184,35,107,0.08)]
    `
    : `
      p-5 md:p-6 rounded-2xl
      bg-white
      border border-black/5
      shadow-[0_6px_18px_rgba(0,0,0,0.06)]
    `

  const iconWrapClass = isEmbedded
    ? 'h-10 w-10 rounded-full bg-[#ffe1f1]/80 border border-[#f5d7e5]/70 flex items-center justify-center shrink-0'
    : 'h-10 w-10 rounded-full bg-black/5 flex items-center justify-center shrink-0'

  const iconClass = isEmbedded ? 'text-[#b8236b]' : 'text-black/70'

  const pillClass = isEmbedded
    ? 'inline-flex items-center rounded-full bg-[#ffe1f1]/70 border border-[#f5d7e5]/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]'
    : 'inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-black/70'

  const titleClass = isEmbedded
    ? 'text-[15px] md:text-[16px] font-semibold text-[#2f3a56]'
    : 'text-[16px] md:text-[17px] font-semibold text-black/85'

  const subtitleClass = isEmbedded
    ? 'text-[12px] text-[#6a6a6a] leading-relaxed'
    : 'text-[13px] text-black/60 leading-relaxed'

  const itemShellClass = isEmbedded
    ? 'rounded-2xl border border-[#f5d7e5]/70 bg-white/70 backdrop-blur px-4 py-3'
    : 'rounded-2xl border border-black/5 bg-white px-4 py-3'

  const itemTagClass = isEmbedded
    ? 'inline-flex w-max items-center rounded-full bg-[#ffe1f1]/70 border border-[#f5d7e5]/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase'
    : 'inline-flex w-max items-center rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-black/70 uppercase'

  const itemTitleClass = isEmbedded
    ? 'mt-1 text-[14px] font-semibold text-[#2f3a56]'
    : 'mt-1 text-[14px] font-semibold text-black/80'

  const itemDescClass = isEmbedded
    ? 'mt-1 text-[12px] text-[#6a6a6a] leading-relaxed whitespace-pre-line'
    : 'mt-1 text-[12px] text-black/60 leading-relaxed whitespace-pre-line'

  const dismissBtnClass = isEmbedded
    ? `
      rounded-full
      bg-white/70 backdrop-blur
      border border-[#f5d7e5]/70
      text-[#545454]
      px-3 py-1.5
      text-[12px]
      transition
      hover:bg-white/80
      whitespace-nowrap
    `
    : `
      rounded-full
      bg-white
      border border-black/10
      text-black/70
      px-3 py-1.5
      text-[12px]
      transition
      hover:shadow-sm
      whitespace-nowrap
    `

  const loadingShellClass = isEmbedded
    ? 'mt-4 rounded-2xl border border-[#f5d7e5]/70 bg-white/70 backdrop-blur px-4 py-3'
    : 'mt-4 rounded-2xl border border-black/5 bg-white px-4 py-3'

  const loadingTextClass = isEmbedded ? 'text-[13px] text-[#6a6a6a]' : 'text-[13px] text-black/60'

  const embeddedButtonClass =
    'h-9 px-4 text-[12px] bg-white/70 backdrop-blur border border-[#f5d7e5]/80 text-[#2f3a56] hover:bg-white/80 shadow-[0_10px_22px_rgba(184,35,107,0.10)] w-full sm:w-auto'

  return (
    <SoftCard className={[shellClass, 'min-w-0 max-w-full overflow-hidden', className ?? ''].join(' ')}>
      {/* FIX MOBILE: header vira coluna no mobile e botão não estoura */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={iconWrapClass}>
            <AppIcon name="sparkles" size={20} className={iconClass} />
          </div>

          <div className="space-y-1 min-w-0">
            <span className={pillClass}>Para agora</span>
            <h3 className={titleClass}>{headerTitle}</h3>

            {/* ✅ ALTERAÇÃO 1: subtítulo */}
            <p className={subtitleClass}>{subtitleText}</p>
          </div>
        </div>

        {/* FIX MOBILE: botão full width */}
        <div className="w-full sm:w-auto shrink-0">
          {isEmbedded ? (
            <Button variant={state.status === 'idle' ? 'secondary' : 'secondary'} className={embeddedButtonClass} onClick={() => void fetchCards()}>
              {/* ✅ ALTERAÇÃO 2: labels do botão */}
              {primaryButtonLabel}
            </Button>
          ) : (
            <Button variant={state.status === 'idle' ? 'default' : 'secondary'} className="px-4 w-full sm:w-auto" onClick={() => void fetchCards()}>
              {/* ✅ ALTERAÇÃO 2: labels do botão */}
              {primaryButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {state.status === 'loading' ? (
        <div className={loadingShellClass}>
          <p className={loadingTextClass}>Carregando…</p>
        </div>
      ) : null}

      {state.status === 'idle' ? (
        <div
          className={
            isEmbedded
              ? 'mt-4 rounded-2xl border border-[#f5d7e5]/60 bg-white/50 backdrop-blur px-4 py-3'
              : 'mt-4 rounded-2xl border border-black/5 bg-white px-4 py-3'
          }
        >
          <p className={isEmbedded ? 'text-[12px] text-[#6a6a6a] leading-relaxed' : 'text-[13px] text-black/60'}>
            Um pequeno apoio pode mudar o tom do resto do dia.
          </p>
        </div>
      ) : null}

      {state.status === 'done' ? (
        <div className="mt-4 space-y-3">
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <div key={item.id} className={itemShellClass}>
                {/* FIX MOBILE: min-w-0 e quebra correta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {item.tag ? <span className={itemTagClass}>{item.tag}</span> : null}
                    <p className={itemTitleClass}>{item.title}</p>
                    {item.description ? <p className={itemDescClass}>{item.description}</p> : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" className={dismissBtnClass} onClick={() => dismissOne(item.id)}>
                      {/* ✅ ALTERAÇÃO 3: label do descarte */}
                      {dismissLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={itemShellClass}>
              <p className={isEmbedded ? 'text-[13px] text-[#6a6a6a]' : 'text-[13px] text-black/60'}>
                Sem pressão. Se quiser, peça outra leva.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </SoftCard>
  )
}
