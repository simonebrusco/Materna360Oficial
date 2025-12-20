'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Step = 'exchange' | 'set_password' | 'done' | 'error'

function safeInternalRedirect(target: string | null | undefined, fallback = '/maternar') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = safeInternalRedirect(redirectToRaw, '/maternar')

  const [step, setStep] = useState<Step>('exchange')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  useEffect(() => {
    // Supabase envia links com ?code=... (PKCE). Precisamos trocar por sessão.
    const code = searchParams.get('code')

    // Alguns setups antigos usam access_token/refresh_token (implícito).
    // Vamos lidar com o caso principal (code) e falhar de forma humana se não vier.
    if (!code) {
      setStep('error')
      setErrorMsg('Esse link não parece válido ou já expirou. Você pode pedir um novo com calma.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return

        if (error) {
          setStep('error')
          setErrorMsg('Esse link pode ter expirado. Se quiser, peça um novo link de recuperação.')
          return
        }

        setStep('set_password')
      } catch {
        if (cancelled) return
        setStep('error')
        setErrorMsg('Não consegui validar seu link agora. Tente novamente em instantes.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, supabase])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!password || password.length < 6) {
      setErrorMsg('Escolha uma senha um pouco mais longa para manter sua conta protegida.')
      return
    }
    if (password !== password2) {
      setErrorMsg('As senhas não estão iguais. Ajuste com calma e tente novamente.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      setLoading(false)

      if (error) {
        setErrorMsg('Não consegui atualizar sua senha agora. Tente novamente em instantes.')
        return
      }

      setStep('done')
      // Pequena pausa emocional: mostra “feito” e depois segue
      setTimeout(() => {
        router.replace(redirectTo)
      }, 700)
    } catch {
      setLoading(false)
      setErrorMsg('Não consegui atualizar sua senha agora. Tente novamente em instantes.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Criar nova senha</h1>

        {step === 'exchange' ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Só um instante… estou validando seu link.</p>
        ) : null}

        {step === 'error' ? (
          <>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {errorMsg || 'Esse link expirou. Você pode pedir um novo com calma.'}
            </p>
            <div className="mt-4 text-xs text-[var(--color-text-muted)]">
              <a className="underline" href={`/recuperar-senha?redirectTo=${encodeURIComponent(redirectTo)}`}>
                Pedir novo link
              </a>
              <span className="mx-2">•</span>
              <a className="underline" href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
                Voltar para entrar
              </a>
            </div>
          </>
        ) : null}

        {step === 'set_password' ? (
          <>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Escolha uma nova senha para entrar com tranquilidade.
            </p>

            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-main)]">Nova senha</label>
                <input
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-main)]">Confirmar nova senha</label>
                <input
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              {errorMsg ? (
                <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-[var(--color-text-main)]">
                  {errorMsg}
                </div>
              ) : null}

              <button
                className="w-full rounded-xl bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        ) : null}

        {step === 'done' ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Pronto. Sua senha foi atualizada. Vamos continuar.
          </p>
        ) : null}
      </div>
    </div>
  )
}
