// app/recuperar-senha/RecoverPasswordClient.tsx
'use client'

import * as React from 'react'
import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'

import { createBrowserSupabaseClient } from '@/app/lib/supabase.client'
import { toast } from '@/app/lib/toast'

function safeInternalRedirect(target: string | null | undefined, fallback = '/maternar') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

/**
 * getSiteUrl
 * - Preferência: env pública em produção (Vercel) -> NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL
 * - Fallback: window.location.origin no client
 * - Normaliza: remove trailing slash, garante protocolo https:// quando necessário
 */
function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL

  const raw = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : envUrl || ''

  const cleaned = String(raw || '').trim().replace(/\/+$/, '')

  if (cleaned && !/^https?:\/\//i.test(cleaned)) return `https://${cleaned}`

  return cleaned
}

export default function RecoverPasswordClient() {
  const searchParams = useSearchParams()

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = useMemo(() => safeInternalRedirect(redirectToRaw, '/maternar'), [redirectToRaw])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return

    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Digite um e-mail válido.')
      return
    }

    setLoading(true)
    try {
      // O link de recovery deve voltar para uma rota pública nossa
      const siteUrl = getSiteUrl()
      const redirectUrl = `${siteUrl}/auth/reset?redirectTo=${encodeURIComponent(redirectTo)}`

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        toast.error('Não conseguimos enviar o e-mail de recuperação. Tente novamente.')
        return
      }

      toast.success('Enviamos um link de recuperação para o seu e-mail.')
      setEmail('')
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-800" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          />
          <p className="text-xs text-neutral-500">
            Você vai receber um e-mail com um link para criar uma nova senha.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>

        <div className="pt-2">
          <a
            className="text-sm font-semibold text-neutral-900 underline underline-offset-4"
            href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          >
            Voltar para Entrar
          </a>
        </div>
      </form>
    </div>
  )
}
