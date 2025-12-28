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
      message: 'Agora confirme seu e-mail para entrar com segurança. Assim que confirmar, você volta e faz login.',
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
            disabled={loading || resendLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#2f3a56]">Senha</label>
          <input
            className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-sm text-[#2f3a56] outline-none placeholder:text-[#545454]/60 focus:border-[#fd2597]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading || resendLoading}
          />
        </div>

        {uiMsg ? (
          <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-xs">
            {uiMsg.title ? <div className="font-semibold text-[#2f3a56]">{uiMsg.title}</div> : null}
            <div className={uiMsg.title ? 'mt-1 text-[#545454]' : 'text-[#545454]'}>{uiMsg.message}</div>

            {signupDone ? (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onResendConfirmation}
                  disabled={resendLoading}
                  className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-xs font-semibold text-[#2f3a56] disabled:opacity-60"
                >
                  {resendLoading ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
                </button>

                <a
                  className="w-full text-center rounded-2xl bg-[#fd2597] px-4 py-3 text-xs font-semibold text-white"
                  href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                >
                  Já confirmei, quero entrar
                </a>

                <div className="text-[11px] text-[#545454]">
                  Dica rápida: às vezes o e-mail cai em spam ou promoções.
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          className="w-full rounded-2xl bg-[#fd2597] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={loading || resendLoading}
        >
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-4 text-xs text-[#545454]">
        Já tem conta?{' '}
        <a
          className="underline decoration-[#F5D7E5] underline-offset-4"
          href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          Entrar
        </a>
      </div>
    </div>
  )
}
