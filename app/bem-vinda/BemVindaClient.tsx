// app/bem-vinda/BemVindaClient.tsx
'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { save } from '@/app/lib/persist'

function safeInternalRedirect(target: string | null | undefined, fallback = '/meu-dia') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

const SEEN_KEY = 'm360_seen_welcome_v1'

export default function BemVindaClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextRaw = searchParams.get('next')
  const nextDest = useMemo(() => safeInternalRedirect(nextRaw, '/meu-dia'), [nextRaw])

  function markSeenSilently() {
    // 1) persist/local (para UX local e compat)
    try {
      save(SEEN_KEY, '1')
    } catch {
      // silencioso
    }

    // 2) cookie (para o middleware decidir a entrada)
    try {
      const maxAge = 60 * 60 * 24 * 180 // 180 dias
      document.cookie = `${SEEN_KEY}=1; Max-Age=${maxAge}; Path=/; SameSite=Lax`
    } catch {
      // silencioso
    }
  }

  function onStartMeuDia() {
    markSeenSilently()
    router.push(nextDest)
  }

  function onGoMaternar() {
    markSeenSilently()
    router.push('/maternar')
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[520px] rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold leading-tight text-[var(--color-text-main)]">
          Você não está falhando.
          <br />
          Você está cansada.
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Entre trabalho, casa, filhos e expectativas,
          <br />
          o dia pesa — e mesmo fazendo o seu melhor,
          <br />
          parece que nunca é suficiente.
        </p>

        <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-main)]">
          O <strong>Materna360</strong> não existe para te ensinar
          <br />
          a ser uma mãe melhor.
          <br />
          <span className="font-medium">Você já é.</span>
        </p>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Ele existe para te ajudar a viver a maternidade
          <br />
          com menos culpa e mais leveza.
        </p>

        <div className="mt-6 space-y-2 text-sm text-[var(--color-text-muted)]">
          <p>• Um jeito mais gentil de organizar o dia</p>
          <p>• Um espaço que também é seu</p>
          <p>• Pequenos apoios pensados para a vida real</p>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">Sem cobrança. Sem perfeição.</p>

        <div className="mt-8 space-y-2">
          <button
            onClick={onStartMeuDia}
            className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Começar pelo Meu Dia
          </button>

          <button
            onClick={onGoMaternar}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:bg-black/[0.02] transition"
          >
            Ir para o Maternar
          </button>

          <p className="pt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            Você pode trocar de aba depois. Aqui é só para te dar um começo leve.
          </p>
        </div>
      </div>
    </div>
  )
}
