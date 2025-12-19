'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function safeRedirectPath(raw: string | null) {
  if (!raw) return '/maternar'
  // só permite caminhos internos
  if (!raw.startsWith('/')) return '/maternar'
  if (raw.startsWith('//')) return '/maternar'
  // evita voltar para login/signup e loop
  if (raw.startsWith('/login') || raw.startsWith('/signup')) return '/maternar'
  return raw
}

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectTo = safeRedirectPath(search.get('redirectTo'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setError(error.message || 'Não foi possível entrar.')
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('Falha ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-10 bg-white">
      <div className="w-full max-w-md rounded-3xl border border-black/10 p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#2f3a56]">Entrar</h1>
          <p className="mt-1 text-sm text-[#545454]">
            Acesse sua jornada no Materna360.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#2f3a56]">E-mail</label>
            <input
              className="mt-1 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2f3a56]">Senha</label>
            <input
              className="mt-1 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#ff005e] text-white py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 text-sm text-[#545454]">
          Ainda não tem conta?{' '}
          <Link className="font-semibold text-[#ff005e]" href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Criar agora
          </Link>
        </div>

        <div className="mt-2 text-xs text-[#545454]/80">
          Ao entrar, você concorda com os termos e políticas do app.
        </div>
      </div>
    </main>
  )
}
