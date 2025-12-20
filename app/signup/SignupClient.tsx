'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function mapSignupErrorToUi(message: string): UiMsg {
  const msg = (message || '').toLowerCase()

  if (msg.includes('user already registered') || msg.includes('already') || msg.includes('exists')) {
    return {
      kind: 'error',
      title: 'Esse e-mail já tem uma conta',
      message: 'Se você já se cadastrou antes, é só entrar. Se preferir, recupere sua senha.',
    }
  }

  if (msg.includes('password') && (msg.includes('weak') || msg.includes('length') || msg.includes('characters'))) {
    return {
      kind: 'error',
      title: 'Vamos fortalecer sua senha',
      message: 'Use uma senha um pouco mais longa para manter sua conta protegida.',
    }
  }

  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
    return {
      kind: 'error',
      title: 'A conexão parece ter oscilado',
      message: 'Tente novamente em instantes. Às vezes é só um momento de instabilidade.',
    }
  }

  if (msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
    return {
      kind: 'error',
      title: 'Um instante',
      message: 'Foram muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
    }
  }

  return {
    kind: 'error',
    title: 'Não consegui criar sua conta agora',
    message: 'Tente novamente em instantes. Se continuar, a gente resolve com calma.',
  }
}

export default function SignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = safeInternalRedirect(redirectToRaw, '/maternar')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const [uiMsg, setUiMsg] = useState<UiMsg | null>(null)
  const [signupDone, setSignupDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUiMsg(null)
    setSignupDone(false)

    const cleanEmail = email.trim()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    })

    setLoading(false)

    if (error) {
      setUiMsg(mapSignupErrorToUi(error.message))
      return
    }

    // Quando confirmação por email está ativa:
    // - pode vir session nula
    // - user existe (data.user) e session pode não existir
    // UX: não redirecionar; explicar e dar ação.
    const hasSession = Boolean(data?.session)

    if (hasSession) {
      setUiMsg({
        kind: 'success',
        title: 'Conta criada',
        message: 'Pronto. Vamos continuar.',
      })
      router.replace(redirectTo)
      return
    }

    setSignupDone(true)
    setUiMsg({
      kind: 'success',
      title: 'Conta criada',
      message:
        'Agora confirme seu e-mail para entrar com segurança. Assim que confirmar, você volta e faz login.',
    })
  }

  async function onResendConfirmation() {
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setUiMsg({
        kind: 'info',
        message: 'Digite seu e-mail acima para eu reenviar o link de confirmação.',
      })
      return
    }

    setResendLoading(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      })

      if (error) {
        const lower = (error.message || '').toLowerCase()
        if (lower.includes('rate') || lower.includes('too many')) {
          setUiMsg({
            kind: 'info',
            message: 'Eu já enviei há pouco. Aguarde alguns minutos e tente novamente.',
          })
        } else {
          setUiMsg({
            kind: 'info',
            message: 'Não consegui reenviar agora. Tente novamente em instantes.',
          })
        }
      } else {
        setUiMsg({
          kind: 'success',
          message: 'Pronto. Reenviei o link. Veja também sua caixa de spam e promoções.',
        })
      }
    } catch {
      setUiMsg({
        kind: 'info',
        message: 'Não consegui reenviar agora. Tente novamente em instantes.',
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Criar conta</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Leva poucos segundos.</p>

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
              disabled={loading || resendLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-main)]">Senha</label>
            <input
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading || resendLoading}
            />
          </div>

          {uiMsg ? (
            <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-[var(--color-text-main)]">
              {uiMsg.title ? <div className="font-semibold">{uiMsg.title}</div> : null}
              <div className={uiMsg.title ? 'mt-1 text-[var(--color-text-muted)]' : ''}>{uiMsg.message}</div>

              {signupDone ? (
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onResendConfirmation}
                    disabled={resendLoading}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-main)] disabled:opacity-60"
                  >
                    {resendLoading ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
                  </button>

                  <a
                    className="w-full text-center rounded-xl bg-[var(--color-brand)] px-3 py-2 text-xs font-semibold text-white"
                    href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                  >
                    Já confirmei, quero entrar
                  </a>

                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    Dica rápida: às vezes o e-mail cai em spam ou promoções.
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            className="w-full rounded-xl bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={loading || resendLoading}
          >
            {loading ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-4 text-xs text-[var(--color-text-muted)]">
          Já tem conta?{' '}
          <a className="underline" href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Entrar
          </a>
        </div>
      </div>
    </div>
  )
}
