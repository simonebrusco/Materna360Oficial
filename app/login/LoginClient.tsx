'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { load } from '@/app/lib/persist'

type UiError = {
  title: string
  message: string
  kind: 'generic' | 'not_confirmed' | 'network' | 'rate_limit'
}

const SEEN_KEY = 'seen_welcome_v1'

function safeInternalRedirect(target: string | null | undefined, fallback = '/meu-dia') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

function mapAuthErrorToUi(errorMessage: string): UiError {
  const msg = (errorMessage || '').toLowerCase()

  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return {
      title: 'Falta só confirmar seu e-mail',
      message:
        'Para proteger sua conta, precisamos que você confirme seu e-mail. Se quiser, eu posso reenviar o link agora.',
      kind: 'not_confirmed',
    }
  }

  if (msg.includes('invalid login credentials') || msg.includes('invalid') || msg.includes('credentials')) {
    return {
      title: 'E-mail ou senha não conferem',
      message: 'Sem problema. Confira os dados e tente mais uma vez, no seu ritmo.',
      kind: 'generic',
    }
  }

  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
    return {
      title: 'Parece que a conexão oscilou',
      message: 'Respira. Tente novamente — às vezes é só um instante de instabilidade.',
      kind: 'network',
    }
  }

  if (msg.includes('too many') || msg.includes('rate') || msg.includes('limit')) {
    return {
      title: 'Vamos com calma',
      message: 'Foram muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
      kind: 'rate_limit',
    }
  }

  return {
    title: 'Não consegui te conectar agora',
    message: 'Tente novamente em instantes. Se continuar, a gente resolve com calma.',
    kind: 'generic',
  }
}

function hasSeenWelcome(): boolean {
  try {
    const v = load<string | null>(SEEN_KEY, null)
    return v === '1'
  } catch {
    return false
  }
}

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = safeInternalRedirect(redirectToRaw, '/meu-dia')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [uiError, setUiError] = useState<UiError | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return

      // Se já logada:
      // - se não viu bem-vinda -> /bem-vinda
      // - senão -> redirectTo
      const seen = hasSeenWelcome()

      if (!seen) {
        router.replace(`/bem-vinda?next=${encodeURIComponent(redirectTo)}`)
      } else {
        router.replace(redirectTo)
      }
    })
  }, [supabase, router, redirectTo])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUiError(null)
    setResendMsg(null)

    const cleanEmail = email.trim()

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    setLoading(false)

    if (error) {
      setUiError(mapAuthErrorToUi(error.message))
      return
    }

    // Pós-login:
    // - primeira vez -> /bem-vinda (com next)
    // - senão -> redirectTo
    const seen = hasSeenWelcome()

    if (!seen) {
      router.replace(`/bem-vinda?next=${encodeURIComponent(redirectTo)}`)
      return
    }

    router.replace(redirectTo)
  }

  async function onResendConfirmation() {
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setResendMsg('Me diga seu e-mail acima para eu reenviar o link de confirmação.')
      return
    }

    setResendLoading(true)
    setResendMsg(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      })

      if (error) {
        const lower = (error.message || '').toLowerCase()
        if (lower.includes('rate') || lower.includes('too many')) {
          setResendMsg('Eu já enviei há pouco. Aguarde alguns minutos e tente novamente.')
        } else {
          setResendMsg('Não consegui reenviar agora. Tente novamente em instantes.')
        }
      } else {
        setResendMsg('Pronto. Reenviei o link. Veja também sua caixa de spam e promoções.')
      }
    } catch {
      setResendMsg('Não consegui reenviar agora. Tente novamente em instantes.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Entrar</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Acesse sua conta para continuar sua jornada.</p>

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
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-main)]">Senha</label>
            <input
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {uiError ? (
            <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-[var(--color-text-main)]">
              <div className="font-semibold">{uiError.title}</div>
              <div className="mt-1 text-[var(--color-text-muted)]">{uiError.message}</div>

              {uiError.kind === 'not_confirmed' ? (
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onResendConfirmation}
                    disabled={resendLoading}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-main)] disabled:opacity-60"
                  >
                    {resendLoading ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
                  </button>

                  {resendMsg ? <div className="text-[11px] text-[var(--color-text-muted)]">{resendMsg}</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            className="w-full rounded-xl bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-3 text-xs text-[var(--color-text-muted)]">
          <a className="underline" href={`/recuperar-senha?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Esqueci minha senha
          </a>
        </div>

        <div className="mt-4 text-xs text-[var(--color-text-muted)]">
          Ainda não tem conta?{' '}
          <a className="underline" href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Criar agora
          </a>
        </div>
      </div>
    </div>
  )
}
