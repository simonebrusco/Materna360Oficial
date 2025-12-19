'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectTo = searchParams.get('redirectTo') || '/maternar'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setMsg(error.message)
      return
    }

    // Se o Supabase exigir confirmação por email, a sessão pode não existir ainda.
    // Mantemos mensagem neutra.
    setMsg('Conta criada. Se solicitado, confirme no seu email e volte para entrar.')
    router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Criar conta</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Leva poucos segundos.
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
              autoComplete="new-password"
              required
            />
          </div>

          {msg ? (
            <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-[var(--color-text-main)]">
              {msg}
            </div>
          ) : null}

          <button
            className="w-full rounded-xl bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
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
