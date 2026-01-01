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

type QuickIdeaMode = 'my_day' | 'cuidar_de_mim'

type QuickIdeaAIProps = {
  mode?: QuickIdeaMode
  className?: string
}

const LS_SAVED_KEY = 'm360.ai.quick_ideas.saved.v1'
const LS_RECENT_KEY = 'm360.ai.quick_ideas.recent.v1'

// Sinal suave (pode ser setado por outro hub, ex.: check-in)
const LS_SIGNAL_KEY = 'm360.my_day.last_signal.v1'

type SoftSignal = 'heavy' | 'tired' | 'overwhelmed' | 'neutral'

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

function isValidSignal(v: any): v is SoftSignal {
  return v === 'heavy' || v === 'tired' || v === 'overwhelmed' || v === 'neutral'
}

function getSoftSignalFromLS(): SoftSignal {
  const raw = safeGetLS(LS_SIGNAL_KEY)
  if (!raw) return 'neutral'
  const v = raw.trim()
  return isValidSignal(v) ? v : 'neutral'
}

function getRecentFromLS(): string[] {
  const raw = safeGetLS(LS_RECENT_KEY)
  const parsed = safeParse<unknown>(raw)
  if (!Array.isArray(parsed)) return []
  return (parsed as any[])
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => String(x).trim())
    .slice(0, 10)
}

function setRecentToLS(ids: string[]) {
  safeSetLS(LS_RECENT_KEY, JSON.stringify(ids.slice(0, 10)))
}

function pushRecentId(id: string) {
  const current = getRecentFromLS()
  const next = [id, ...current.filter((x) => x !== id)].slice(0, 10)
  setRecentToLS(next)
  return next
}

/**
 * Normaliza múltiplos formatos de resposta:
 * - Formato legado (catálogo): { access, ideas: [{id,title,summary,...}] }
 * - Formato leve (Meu Dia):   { suggestions: [{id,title,description}] }
 * - Formato alternativo:      { title/body }
 */
function normalize(payload: any): Suggestion[] | null {
  if (!payload) return null

  // Formato legado: { ideas: QuickIdea[] }
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

  // Formato leve: { suggestions: [{id,title,description}] }
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

function baseFallbackForMode(mode: QuickIdeaMode): Suggestion[] {
  if (mode === 'cuidar_de_mim') {
    return [
      { id: 'fallback-c-1', title: 'Soltar os ombros (3x)', description: 'Bem leve. Só para o corpo baixar um pouco.' },
      { id: 'fallback-c-2', title: 'Respirar 4–2–6 (3 voltas)', description: 'Um minuto. Se não der, uma volta já serve.' },
      { id: 'fallback-c-3', title: 'Água (3 goles)', description: 'Uma âncora rápida, sem pressão.' },
      { id: 'fallback-c-4', title: 'Olhar pela janela (30s)', description: 'Só para dar um respiro ao pensamento.' },
      { id: 'fallback-c-5', title: 'Mãos no peito (2 respirações)', description: 'Pequeno e suficiente.' },
    ]
  }

  // my_day (fallback atual)
  return [
    { id: 'fallback-1', title: 'Respirar por 1 minuto', description: 'Só para o corpo voltar para o presente.' },
    { id: 'fallback-2', title: 'Escolher uma coisa pequena', description: 'Uma só. O resto pode esperar.' },
    { id: 'fallback-3', title: 'Fazer o próximo passo mais simples', description: 'Bem simples — só para destravar.' },
    { id: 'fallback-4', title: 'Beber um copo de água', description: 'Uma âncora rápida para agora.' },
    { id: 'fallback-5', title: 'Pedir ajuda com uma frase curta', description: 'Uma frase resolve mais do que parece.' },
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

export default function QuickIdeaAI({ mode = 'my_day', className }: QuickIdeaAIProps) {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [dismissed, setDismissed] = useState<Record<string, true>>({})
  const [saved, setSaved] = useState<Suggestion[]>(() => (mode === 'my_day' ? getSavedFromLS() : []))

  const lastSigRef = useRef<string>('')
  const fallbackSeedRef = useRef<number>(Date.now())

  const visibleItems = useMemo(() => {
    if (state.status !== 'done') return []
    return state.items.filter((i) => !dismissed[i.id])
  }, [state, dismissed])

  const run = useCallback(
    async (attempt = 0) => {
      setState({ status: 'loading' })

      const nonce = Date.now()

      // MY_DAY: memória contextual suave (local)
      // CUIDAR_DE_MIM: sem memória, sem Eu360, sem histórico
      const recentIds = mode === 'my_day' ? getRecentFromLS() : []
      const signal = mode === 'my_day' ? getSoftSignalFromLS() : 'neutral'

      // Mantém compatibilidade com o endpoint existente
      // - intent: quick_idea (o backend atual já entende)
      // - hub: só um hint (se backend ignorar, segue funcionando)
      const payload: any = {
        intent: 'quick_idea' as const,
        hub: mode === 'cuidar_de_mim' ? 'cuidar_de_mim' : 'my_day',
        nonce,
        locale: 'pt-BR' as const,
      }

      if (mode === 'my_day') {
        payload.memory = {
          recent_suggestion_ids: recentIds,
          last_signal: signal,
        }
      }

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
          // GET fallback (se existir GET futuramente)
          const getRes = await fetch(`/api/ai/quick-ideas?nonce=${nonce}`, {
            method: 'GET',
            cache: 'no-store',
          })
          if (getRes.ok) data = await getRes.json().catch(() => null)
        }

        const normalized = normalize(data)
        const nextItems =
          normalized ??
          shuffle(
            baseFallbackForMode(mode),
            (fallbackSeedRef.current = fallbackSeedRef.current + (mode === 'cuidar_de_mim' ? 11 : 17))
          ).slice(0, 3)

        // MY_DAY: atualiza memória recente
        // CUIDAR_DE_MIM: não grava nada
        if (mode === 'my_day' && nextItems[0]?.id) {
          pushRecentId(nextItems[0].id)
        }

        const sig = signature(nextItems)
        if (sig && sig === lastSigRef.current && attempt < 1) {
          return await run(attempt + 1)
        }

        lastSigRef.current = sig
        setDismissed({})
        setState({ status: 'done', items: nextItems })
      } catch {
        const nextItems = shuffle(
          baseFallbackForMode(mode),
          (fallbackSeedRef.current = fallbackSeedRef.current + (mode === 'cuidar_de_mim' ? 13 : 23))
        ).slice(0, 3)

        if (mode === 'my_day' && nextItems[0]?.id) {
          pushRecentId(nextItems[0].id)
        }

        const sig = signature(nextItems)
        if (sig && sig === lastSigRef.current && attempt < 1) {
          return await run(attempt + 1)
        }

        lastSigRef.current = sig
        setDismissed({})
        setState({ status: 'done', items: nextItems })
      }
    },
    [mode]
  )

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => ({ ...prev, [id]: true }))
  }, [])

  const saveOne = useCallback(
    (item: Suggestion) => {
      // Guardar só existe no MY_DAY
      if (mode !== 'my_day') {
        dismissOne(item.id)
        return
      }

      const key = `${item.title}::${item.description ?? ''}`.trim()
      const exists = saved.some((s) => `${s.title}::${s.description ?? ''}`.trim() === key)
      if (exists) return

      const next = [{ ...item, id: `saved-${Date.now()}` }, ...saved].slice(0, 50)
      setSaved(next)
      setSavedToLS(next)
      dismissOne(item.id)
    },
    [saved, dismissOne, mode]
  )

  const removeSaved = useCallback(
    (id: string) => {
      if (mode !== 'my_day') return
      const next = saved.filter((s) => s.id !== id)
      setSaved(next)
      setSavedToLS(next)
    },
    [saved, mode]
  )

  const ui = useMemo(() => {
    if (mode === 'cuidar_de_mim') {
      return {
        ctaIdle: 'Se quiser, eu te sugiro um cuidado bem pequeno agora',
        loading: 'Pensando em algo bem leve…',
        headerDone: 'Um cuidado pequeno para agora (opcional)',
        refresh: 'Outra sugestão',
        dismiss: 'Não agora',
        save: 'Ok',
        empty: 'Sem pressão. Se quiser, pode pedir outra sugestão.',
      }
    }

    return {
      ctaIdle: 'Me dá uma ideia simples para agora',
      loading: 'Pensando em algo leve…',
      headerDone: 'Ideias simples para este momento',
      refresh: 'Outra ideia',
      dismiss: 'Não agora',
      save: 'Guardar',
      empty: 'Sem pressão. Se quiser, peça outra ideia.',
    }
  }, [mode])

  return (
    <div className={['mt-6 md:mt-8', className ?? ''].join(' ')}>
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
            <span className="text-[14px] font-semibold">{ui.ctaIdle}</span>
            <span className="h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
              <AppIcon name="sparkles" size={18} className="text-[#fd2597]" />
            </span>
          </button>
        ) : null}

        {state.status === 'loading' ? <p className="text-[13px] text-[#6A6A6A]">{ui.loading}</p> : null}

        {state.status === 'done' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#6A6A6A]">{ui.headerDone}</p>

              <button
                type="button"
                className="text-[12px] font-semibold text-[#fd2597] hover:opacity-90 transition"
                onClick={() => void run()}
              >
                {ui.refresh}
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
                          {ui.dismiss}
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
                          {ui.save}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#F5D7E5]/70 bg-white px-4 py-3">
                <p className="text-[13px] text-[#6A6A6A]">{ui.empty}</p>
              </div>
            )}

            {/* Guardadas só no MY_DAY */}
            {mode === 'my_day' && saved.length ? (
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
