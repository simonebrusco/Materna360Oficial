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

/**
 * P34.11.1 — Inteligência de Variação (IA)
 * - Eixos permitidos: energy_level, variation_axis
 * - Aplicação: somente neste card (Cuidar de Mim → ParaAgoraSupportCard)
 * - Silencioso (não expõe UI)
 *
 * Regra fixa:
 * - Um único variation_axis por geração.
 * - A UI deve refletir esse eixo (tags/itens coerentes).
 */
type EnergyLevel = 'low' | 'medium'
type VariationAxis = 'frase' | 'cuidado' | 'ritual' | 'limite' | 'presenca'

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
 * Split simples para quebrar texto em partes curtas (sem mudar UX).
 * Usado para criar 3 itens coerentes com um único axis,
 * mesmo quando o schema traz 3 campos (phrase/care/ritual).
 */
function splitIntoShortParts(raw: string, maxParts: number): string[] {
  const text = String(raw ?? '').trim()
  if (!text) return []

  // Quebra por linhas e pontuação comum.
  const parts = text
    .replace(/\r/g, '')
    .split(/\n+|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  // Se ficou tudo num bloco, tenta “fatiar” por vírgulas longas.
  if (parts.length <= 1) {
    const byComma = text
      .split(/,\s+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (byComma.length > 1) return byComma.slice(0, maxParts)
  }

  return parts.slice(0, maxParts)
}

/**
 * Fallback base (sem IA).
 * IMPORTANTE P34.11.1: tags sempre dentro do vocabulário oficial.
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
      description: 'Quando o dia pesa, um pouco de gentileza já muda o tom.',
    },
    {
      id: 'fb-3',
      tag: 'ritual',
      title: 'Um respiro já conta.',
      description: 'Do jeito que der, sem transformar isso em tarefa.',
    },
    {
      id: 'fb-4',
      tag: 'limite',
      title: 'Limite também é cuidado.',
      description: 'Proteger o que importa pode ser silencioso — e sem culpa.',
    },
    {
      id: 'fb-5',
      tag: 'presenca',
      title: 'Estar aqui por alguns segundos já é presença.',
      description: 'Nem tudo precisa virar conversa, solução ou explicação.',
    },
  ]
}

type EmocionalPayload = {
  inspiration?: {
    phrase?: string
    care?: string
    ritual?: string
  }
} | null

/**
 * Normaliza a resposta do /api/ai/emocional (daily_inspiration) para 3 cards,
 * respeitando a regra fixa:
 * - UM único variation_axis por geração.
 *
 * Observação importante:
 * O schema sempre retorna phrase/care/ritual.
 * Aqui nós “damos forma” a 3 itens com o MESMO tag (axis),
 * derivando 3 micro-blocos coerentes (sem misturar tags).
 */
function normalizeFromEmocional(payload: EmocionalPayload, axis: VariationAxis): Suggestion[] | null {
  const insp = payload?.inspiration
  if (!insp) return null

  const phrase = typeof insp.phrase === 'string' ? insp.phrase.trim() : ''
  const care = typeof insp.care === 'string' ? insp.care.trim() : ''
  const ritual = typeof insp.ritual === 'string' ? insp.ritual.trim() : ''

  if (!phrase || !care || !ritual) return null

  // O axis governa a “forma” dos 3 itens.
  if (axis === 'frase') {
    // 3 frases curtas (1 do phrase + 2 derivadas do início de care/ritual)
    const careParts = splitIntoShortParts(care, 2)
    const ritualParts = splitIntoShortParts(ritual, 2)

    const items: Suggestion[] = [
      { id: 'inspo-frase-1', tag: axis, title: phrase },
      {
        id: 'inspo-frase-2',
        tag: axis,
        title: careParts[0] ?? 'Hoje pode ser um pouco mais leve do que parece.',
      },
      {
        id: 'inspo-frase-3',
        tag: axis,
        title: ritualParts[0] ?? 'Um respiro possível já conta.',
      },
    ]
    return items.slice(0, 3)
  }

  if (axis === 'cuidado') {
    // 3 micro-blocos de cuidado (quebrando care em partes curtas)
    const parts = splitIntoShortParts(care, 3)
    const a = parts[0] ?? care
    const b = parts[1] ?? ''
    const c = parts[2] ?? ''

    const items: Suggestion[] = [
      { id: 'inspo-cuidado-1', tag: axis, title: 'Um cuidado que acolhe', description: a },
      { id: 'inspo-cuidado-2', tag: axis, title: 'Sem cobrança', description: b || a },
      { id: 'inspo-cuidado-3', tag: axis, title: 'Gentileza possível', description: c || a },
    ]
    return items.slice(0, 3)
  }

  if (axis === 'ritual') {
    // 3 linhas/âncoras curtas (ritual como centro, mas tudo tag=ritual)
    const ritualParts = splitIntoShortParts(ritual, 2)
    const careParts = splitIntoShortParts(care, 2)

    const items: Suggestion[] = [
      { id: 'inspo-ritual-1', tag: axis, title: ritualParts[0] || ritual },
      { id: 'inspo-ritual-2', tag: axis, title: careParts[0] || 'Um pouco de calma também é cuidado.' },
      { id: 'inspo-ritual-3', tag: axis, title: phrase || 'Um gesto pequeno já muda o tom.' },
    ]
    return items.slice(0, 3)
  }

  if (axis === 'limite') {
    // O backend foi instruído a manter o foco em limite sem culpa.
    // Aqui garantimos 3 itens com tag=limite, priorizando frase + partes curtas de care/ritual.
    const careParts = splitIntoShortParts(care, 2)
    const ritualParts = splitIntoShortParts(ritual, 2)

    const items: Suggestion[] = [
      { id: 'inspo-limite-1', tag: axis, title: phrase },
      {
        id: 'inspo-limite-2',
        tag: axis,
        title: 'Limite sem culpa',
        description: careParts.join('\n') || care,
      },
      {
        id: 'inspo-limite-3',
        tag: axis,
        title: ritualParts[0] || ritual,
      },
    ]
    return items.slice(0, 3)
  }

  // presenca
  {
    const careParts = splitIntoShortParts(care, 2)
    const ritualParts = splitIntoShortParts(ritual, 2)

    const items: Suggestion[] = [
      { id: 'inspo-presenca-1', tag: axis, title: phrase },
      {
        id: 'inspo-presenca-2',
        tag: axis,
        title: 'Presença possível',
        description: careParts.join('\n') || care,
      },
      {
        id: 'inspo-presenca-3',
        tag: axis,
        title: ritualParts[0] || ritual,
      },
    ]
    return items.slice(0, 3)
  }
}

/**
 * Seleção dirigida e silenciosa:
 * - variation_axis: alterna entre eixos permitidos por seed (sem expor à usuária)
 * - energy_level: coerente com Cuidar de Mim → restringe a low|medium
 */
function pickVariationAxis(seed: number): VariationAxis {
  const axes: VariationAxis[] = ['frase', 'cuidado', 'ritual', 'limite', 'presenca']
  return axes[seed % axes.length]
}

function pickEnergyLevel(): EnergyLevel {
  // Coerência emocional para Cuidar de Mim:
  // manhã/tarde → medium (estrutura leve), noite/madrugada → low (acolhimento/pausa)
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6 ? 'low' : 'medium'
}

/**
 * Gera fallback coerente com o axis:
 * - Reusa baseFallback, mas filtra por tag do eixo.
 * - Se não houver 3 itens suficientes, completa com base geral (sem quebrar UI).
 * - Todos os itens saem com tag = axis (regra P34.11.1).
 */
function fallbackByAxis(axis: VariationAxis, seed: number): Suggestion[] {
  const base = shuffle(baseFallback(), seed)
  const primary = base.filter((i) => i.tag === axis)
  const out: Suggestion[] = []

  // Primeiro tenta preencher com itens do eixo.
  for (const it of primary) {
    if (out.length >= 3) break
    out.push({ ...it, tag: axis })
  }

  // Completa com itens gerais, mas forçando tag=axis para não “misturar eixos” na UI.
  if (out.length < 3) {
    for (const it of base) {
      if (out.length >= 3) break
      if (out.some((x) => x.id === it.id)) continue
      out.push({ ...it, tag: axis })
    }
  }

  return out.slice(0, 3)
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

    /**
     * P34.11.1 — parâmetros internos (silenciosos)
     * Regra: 1 axis por geração.
     * Em caso de retry (attempt=1), muda o axis para reduzir chance de repetição,
     * sem expor isso à usuária e sem criar "aleatoriedade solta".
     */
    const baseSeed = (seedRef.current = seedRef.current + 19)
    const variation_axis: VariationAxis = pickVariationAxis(baseSeed + attempt)
    const energy_level: EnergyLevel = pickEnergyLevel()

    try {
      const res = await fetch(`/api/ai/emocional?nonce=${nonce}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'daily_inspiration',
          origin: 'cuidar-de-mim',
          context: {
            energy_level,
            variation_axis,
          },
        }),
      })

      let data: any = null
      if (res.ok) data = await res.json().catch(() => null)

      // ✅ Regra P34.11.1: normalização respeita 1 axis por geração
      const normalized = normalizeFromEmocional(data, variation_axis)

      // ✅ Fallback coerente com o axis (sem tags fora do vocabulário)
      const nextItems = (normalized ?? fallbackByAxis(variation_axis, baseSeed)).slice(0, 3)

      const sig = signature(nextItems)
      if (sig && sig === lastSigRef.current && attempt < 1) return await fetchCards(attempt + 1)

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    } catch {
      const nextItems = fallbackByAxis(variation_axis, (seedRef.current = seedRef.current + 31)).slice(0, 3)
      const sig = signature(nextItems)

      if (sig && sig === lastSigRef.current && attempt < 1) return await fetchCards(attempt + 1)

      lastSigRef.current = sig
      setDismissed({})
      setState({ status: 'done', items: nextItems })
    }
  }, [])

  const isEmbedded = variant === 'embedded'
  const headerTitle = isEmbedded ? 'Um respiro para agora' : 'Um apoio para este momento'

  /* =========================================================
     ✅ P34.11 — 3 ALTERAÇÕES (COPY FINAL)
     1) Subtítulo
     2) Label do botão (idle/done)
     3) “Não agora” -> “Fechar este”
  ========================================================= */

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

        <div className="w-full sm:w-auto shrink-0">
          {isEmbedded ? (
            <Button variant="secondary" className={embeddedButtonClass} onClick={() => void fetchCards()}>
              {/* ✅ ALTERAÇÃO 2: labels */}
              {primaryButtonLabel}
            </Button>
          ) : state.status === 'idle' ? (
            // ✅ idle: sem variant (evita "default" inválido)
            <Button className="px-4 w-full sm:w-auto" onClick={() => void fetchCards()}>
              {primaryButtonLabel}
            </Button>
          ) : (
            // ✅ done: secondary (aceito pelo seu ButtonVariant)
            <Button variant="secondary" className="px-4 w-full sm:w-auto" onClick={() => void fetchCards()}>
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {item.tag ? <span className={itemTagClass}>{item.tag}</span> : null}
                    <p className={itemTitleClass}>{item.title}</p>
                    {item.description ? <p className={itemDescClass}>{item.description}</p> : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" className={dismissBtnClass} onClick={() => dismissOne(item.id)}>
                      {/* ✅ ALTERAÇÃO 3: label */}
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
