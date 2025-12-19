'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectTo = searchParams.get('redirectTo') || '/maternar'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Se já estiver logada, não faz sentido ficar no /login
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirectTo)
    })
  }, [supabase, router, redirectTo])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    router.replace(redirectTo)
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Entrar</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Acesse sua conta para continuar sua jornada.
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
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

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
