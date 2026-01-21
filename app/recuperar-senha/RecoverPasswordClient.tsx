'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type UiMsgKind = 'info' | 'error' | 'success'

type UiMsg = {
  kind: UiMsgKind
  title?: string
  message: string
}

function safeInternalRedirect(target: string | null | undefined, fallback = '/maternar') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

function mapRecoverErrorToUi(message: string): UiMsg {
  const msg = (message || '').toLowerCase()

  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
    return {
      kind: 'error',
      title: 'A conexão parece ter oscilado',
      message: 'Tente novamente em instantes. Às vezes é só um momento de instabilidade.',
    }
  }

  if (msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
    return {
      kind: 'info',
      title: 'Um instante',
      message: 'Eu já enviei há pouco. Aguarde alguns minutos e tente novamente.',
    }
  }

  // Não expor “user not found” etc. (por segurança e UX)
  return {
    kind: 'info',
    title: 'Se esse e-mail existir, eu vou te ajudar',
    message: 'Enviei um link para você criar uma nova senha. Veja também spam e promoções.',
  }
}

export default function RecoverPasswordClient() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = safeInternalRedirect(redirectToRaw, '/maternar')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [uiMsg, setUiMsg] = useState<UiMsg | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUiMsg(null)

    const cleanEmail = email.trim()

    try {
      // O link de recovery deve voltar para uma rota pública nossa
     const siteUrl = getSiteUrl()
const redirectUrl = `${siteUrl}/auth/reset?redirectTo=${encodeURIComponent(redirectTo)}`

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      setLoading(false)

      if (error) {
        setUiMsg(mapRecoverErrorToUi(error.message))
        return
      }

      setUiMsg({
        kind: 'success',
        title: 'Pronto',
        message: 'Enviei um link para você criar uma nova senha. Veja também spam e promoções.',
      })
    } catch {
      setLoading(false)
      setUiMsg({
        kind: 'error',
        title: 'Não consegui agora',
        message: 'Tente novamente em instantes. Se continuar, a gente resolve com calma.',
      })
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Recuperar senha</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Me diga seu e-mail e eu te envio um link para criar uma nova senha.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-main)]">Email</label>
            <input
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          {uiMsg ? (
            <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-[var(--color-text-main)]">
              {uiMsg.title ? <div className="font-semibold">{uiMsg.title}</div> : null}
              <div className={uiMsg.title ? 'mt-1 text-[var(--color-text-muted)]' : ''}>{uiMsg.message}</div>
            </div>
          ) : null}

          <button
            className="w-full rounded-xl bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>

        <div className="mt-4 text-xs text-[var(--color-text-muted)]">
          <a className="underline" href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Voltar para entrar
          </a>
        </div>
      </div>
    </div>
  )
}
