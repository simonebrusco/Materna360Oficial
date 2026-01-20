// app/login/LoginClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { supabaseBrowser } from '@/app/lib/supabase'

type UiError = {
  title: string
  message: string
  kind: 'generic' | 'not_confirmed' | 'network' | 'rate_limit'
}

const SEEN_KEY = 'm360_seen_welcome_v1'

function safeInternalRedirect(target: string | null | undefined, fallback = '/meu-dia') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

function hasSeenWelcomeCookie(): boolean {
  try {
    if (typeof document === 'undefined') return false
    return document.cookie.split(';').some((c) => c.trim().startsWith(`${SEEN_KEY}=1`))
  } catch {
    return false
  }
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

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // padronizado com o resto do app
  const supabase = useMemo(() => supabaseBrowser(), [])

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = safeInternalRedirect(redirectToRaw, '/meu-dia')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [uiError, setUiError] = useState<UiError | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return
        if (!data.session) return

        const seen = hasSeenWelcomeCookie()
        if (!seen) router.replace(`/bem-vinda?next=${encodeURIComponent(redirectTo)}`)
        else router.replace(redirectTo)
      })
      .catch(() => {
        // se falhar, fica na tela
      })

    return () => {
      alive = false
    }
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

    const seen = hasSeenWelcomeCookie()
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
    <div className="w-full">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#2f3a56]">Email</label>
          <input
            className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-sm text-[#2f3a56] outline-none placeholder:text-[#545454]/60 focus:border-[#fd2597]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#2f3a56]">Senha</label>
          <input
            className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-sm text-[#2f3a56] outline-none placeholder:text-[#545454]/60 focus:border-[#fd2597]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {uiError ? (
          <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-xs">
            <div className="font-semibold text-[#2f3a56]">{uiError.title}</div>
            <div className="mt-1 text-[#545454]">{uiError.message}</div>

            {uiError.kind === 'not_confirmed' ? (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onResendConfirmation}
                  disabled={resendLoading}
                  className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-xs font-semibold text-[#2f3a56] disabled:opacity-60"
                >
                  {resendLoading ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
                </button>

                {resendMsg ? <div className="text-[11px] text-[#545454]">{resendMsg}</div> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          className="w-full rounded-2xl bg-[#fd2597] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 text-xs text-[#545454]">
        <a
          className="underline decoration-[#F5D7E5] underline-offset-4"
          href={`/recuperar-senha?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          Esqueci minha senha
        </a>
      </div>

      <div className="mt-4 text-xs text-[#545454]">
        Ainda não tem conta?{' '}
        <a
          className="underline decoration-[#F5D7E5] underline-offset-4"
          href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          Criar agora
        </a>
      </div>
    </div>
  )
}
