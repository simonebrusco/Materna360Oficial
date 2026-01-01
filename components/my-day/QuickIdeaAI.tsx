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
  | { status: 'done'; item: Suggestion }

const LS_SAVED_KEY = 'm360.ai.quick_ideas.saved.v1'

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

function normalizeOne(payload: any): Suggestion | null {
  if (!payload) return null

  // Formato A: { suggestions: [{id,title,description}] }
  if (Array.isArray(payload?.suggestions)) {
    const first = payload.suggestions.find((x: any) => x && typeof x.title === 'string' && x.title.trim())
    if (!first) return null
    return {
      id: typeof first.id === 'string' && first.id.trim() ? first.id : 'ai-1',
      title: String(first.title),
      description: typeof first.description === 'string' && first.description.trim() ? String(first.description) : undefined,
    }
  }

  // Formato B: { title, body } (legado)
  if (typeof payload?.title === 'string' || typeof payload?.body === 'string') {
    const rawLines = String(payload?.body ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)

    const firstLine = rawLines[0] ?? (typeof payload?.title === 'string' ? payload.title : '')
    if (!firstLine || !String(firstLine).trim()) return null

    return { id: 'ai-1', title: String(firstLine).trim() }
  }

  return null
}

function baseFallback(): Suggestion[] {
  return [
    { id: 'fallback-1', title: 'Respire por 1 minuto', description: 'Só para o corpo entender que você chegou.' },
    { id: 'fallback-2', title: 'Escolha só uma coisa para agora', description: 'O resto pode esperar um pouco.' },
    { id: 'fallback-3', title: 'Faça um passo pequeno', description: 'Algo simples já organiza por dentro.' },
    { id: 'fallback-4', title: 'Beba um copo de água', description: 'Uma âncora rápida no presente.' },
    { id: 'fallback-5', title: 'Escreva uma frase do que está pesado', description: 'Só para tirar da cabeça e pôr no chão.' },
  ]
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

function signatureOne(item: Suggestion) {
  return `${item.title}::${item.description ?? ''}`.trim()
}

function getSavedFromLS(): Suggestion[] {
  const raw = safeGetLS(LS_SAVED_KEY)
  const parsed = safeParse<unknown>(raw)
  if (!Array.isArray(parsed)) return []
  const items = (parsed as any[])
    .filter(x => x && typeof x.title === 'string' && x.title.trim())
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

/**
 * Meu Dia — resposta curta, aterrissadora e fechada:
 * 1) reconhecimento breve
 * 2) 1 foco
 * 3) encerramento calmo
 */
function toMeuDiaCopy(item: Suggestion) {
  const focus = item.description?.trim()
    ? `${item.title.trim()}. ${item.description.trim()}`
    : item.title.trim()

  const recognition = 'Parece que hoje está com muita coisa ao mesmo tempo.'
  const oneFocus = `Por agora, fique só com isto: ${focus}`
  const close = 'Só isso já devolve um pouco de chão.'

  return { recognition, oneFocus, close }
}

export default function QuickIdeaAI() {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [saved, setSaved] = useState<Suggestion[]>(() => getSavedFromLS())

  const lastSigRef = useRef<string>('')
  const fallbackSeedRef = useRef<number>(Date.now())

  const run = useCallback(async (attempt = 0) => {
    setState({ status: 'loading' })

    const nonce = Date.now()

    try {
      // POST (preferido)
      const postRes = await fetch('/api/ai/quick-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intent: 'quick_idea', nonce }),
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

      const normalized = normalizeOne(data)
      const fallbackOne = shuffle(baseFallback(), (fallbackSeedRef.current = fallbackSeedRef.current + 17))[0]!

      const nextItem = normalized ?? fallbackOne
      const sig = signatureOne(nextItem)

      // se repetiu exatamente e ainda não tentou, tenta mais uma vez
      if (sig && sig === lastSigRef.current && attempt < 1) {
        return await run(attempt + 1)
      }

      lastSigRef.current = sig
      setState({ status: 'done', item: nextItem })
    } catch {
      const nextItem = shuffle(baseFallback(), (fallbackSeedRef.current = fallbackSeedRef.current + 23))[0]!
      const sig = signatureOne(nextItem)

      if (sig && sig === lastSigRef.current && attempt < 1) {
        return await run(attempt + 1)
      }

      lastSigRef.current = sig
      setState({ status: 'done', item: nextItem })
    }
  }, [])

  const saveCurrent = useCallback(() => {
    if (state.status !== 'done') return
    const item = state.item

    const key = `${item.title}::${item.description ?? ''}`.trim()
    const exists = saved.some(s => `${s.title}::${s.description ?? ''}`.trim() === key)
    if (exists) return

    const next = [{ ...item, id: `saved-${Date.now()}` }, ...saved].slice(0, 50)
    setSaved(next)
    setSavedToLS(next)
  }, [saved, state])

  const close = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  const meuDiaText = useMemo(() => {
    if (state.status !== 'done') return null
    return toMeuDiaCopy(state.item)
  }, [state])

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

        {state.status === 'done' && meuDiaText ? (
          <div className="space-y-3">
            <div
              className="
                rounded-2xl
                border border-[#F5D7E5]/70
                bg-white
                px-4 py-3
              "
            >
              <p className="text-[13px] text-[#6A6A6A] leading-relaxed">{meuDiaText.recognition}</p>
              <p className="mt-2 text-[14px] font-semibold text-[#2f3a56] leading-relaxed">{meuDiaText.oneFocus}</p>
              <p className="mt-2 text-[13px] text-[#6A6A6A] leading-relaxed">{meuDiaText.close}</p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="
                  rounded-full
                  bg-white
                  border border-[#F5D7E5]/70
                  text-[#545454]
                  px-4 py-2
                  text-[12px]
                  transition
                  hover:shadow-sm
                  whitespace-nowrap
                "
                onClick={close}
              >
                Ok
              </button>

              <button
                type="button"
                className="
                  rounded-full
                  bg-[#fd2597]
                  text-white
                  px-4 py-2
                  text-[12px]
                  font-semibold
                  transition
                  hover:opacity-95
                  whitespace-nowrap
                "
                onClick={saveCurrent}
              >
                Guardar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
