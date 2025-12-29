'use client'

import { useCallback, useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { AISuggestion } from '@/app/lib/ai/orchestrator.types'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: AISuggestion[] }

function getFallback(): AISuggestion[] {
  return [
    { id: 'fallback-1', title: 'Respirar por 1 minuto', description: 'Uma pausa curta já ajuda a reorganizar.' },
    { id: 'fallback-2', title: 'Escolher só uma prioridade', description: 'O resto pode esperar.' },
    { id: 'fallback-3', title: 'Fazer algo simples', description: 'Algo pequeno já é suficiente por agora.' },
  ]
}

function normalize(payload: any): AISuggestion[] | null {
  if (!payload) return null

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

export default function QuickIdeaAI() {
  const [state, setState] = useState<State>({ status: 'idle' })

  const run = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const postRes = await fetch('/api/ai/quick-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intent: 'quick_idea' }),
      })

      let data: any = null
      if (postRes.ok) {
        data = await postRes.json().catch(() => null)
      } else {
        const getRes = await fetch('/api/ai/quick-ideas', { method: 'GET' })
        if (getRes.ok) data = await getRes.json().catch(() => null)
      }

      const items = normalize(data) ?? getFallback()
      setState({ status: 'done', items })
    } catch {
      setState({ status: 'done', items: getFallback() })
    }
  }, [])

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

            {state.items.map(item => (
              <div
                key={item.id}
                className="
                  rounded-2xl
                  border border-[#F5D7E5]/70
                  bg-white
                  px-4 py-3
                "
              >
                <p className="text-[14px] font-semibold text-[#2f3a56]">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-[12px] text-[#6A6A6A] leading-relaxed">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
