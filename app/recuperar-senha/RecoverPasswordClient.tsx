// app/recuperar-senha/RecoverPasswordClient.tsx
'use client'

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

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
 * getSiteUrl()
 * Prioridade:
 * 1) NEXT_PUBLIC_SITE_URL (ideal para Vercel + domínio)
 * 2) window.location.origin (cliente)
 * Fallback defensivo: https://materna360.com.br
 */
function getSiteUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim()
  const fromEnv = envUrl ? envUrl.replace(/\/+$/, '') : ''

  if (fromEnv) return fromEnv

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }

  return 'https://materna360.com.br'
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) return null
  return createBrowserClient(url, anon)
}

export default function RecoverPasswordClient() {
  const searchParams = useSearchParams()

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = useMemo(() => safeInternalRedirect(redirectToRaw, '/maternar'), [redirectToRaw])

  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSending) return

    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Digite um e-mail válido.')
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      toast.error('Configuração do Supabase ausente. Verifique as variáveis de ambiente.')
      return
    }

    setIsSending(true)
    setSent(false)

    try {
      // O link de recovery deve voltar para uma rota pública nossa
      const siteUrl = getSiteUrl()
      const redirectUrl = `${siteUrl}/auth/reset?redirectTo=${encodeURIComponent(redirectTo)}`

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        toast.error(error.message || 'Não foi possível enviar o e-mail de recuperação.')
        return
      }

      setSent(true)
      toast.success('Enviamos um link de recuperação. Verifique seu e-mail.')
    } catch {
      toast.error('Erro inesperado ao enviar o e-mail de recuperação.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-neutral-800">E-mail</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
          />
          <p className="text-xs text-neutral-500">
            Você receberá um link para definir uma nova senha.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSending ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>

        {sent ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Link enviado. Se não aparecer na caixa de entrada, confira o spam.
          </div>
        ) : null}

        <div className="pt-2 text-center text-sm">
          <a className="underline" href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Voltar para o login
          </a>
        </div>
      </form>
    </div>
  )
}
