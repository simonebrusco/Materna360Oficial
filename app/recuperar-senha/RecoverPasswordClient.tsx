// app/recuperar-senha/RecoverPasswordClient.tsx
'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { supabaseBrowser } from '@/app/lib/supabase.client'
import { toast } from '@/app/lib/toast'

function safeInternalRedirect(target: string | null | undefined, fallback = '/maternar') {
  const t = String(target || '').trim()
  if (!t) return fallback
  // apenas caminhos internos
  if (!t.startsWith('/')) return fallback
  // evita open-redirect
  if (t.startsWith('//')) return fallback
  // bloqueia URLs absolutas disfarçadas
  if (t.includes('://')) return fallback
  return t
}

function getSiteUrl() {
  // Prioridade: env pública (para produção / vercel) -> window.origin (fallback)
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = envUrl || origin || ''
  return base.replace(/\/+$/, '') // remove barra final
}

export default function RecoverPasswordClient() {
  const searchParams = useSearchParams()

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = useMemo(() => safeInternalRedirect(redirectToRaw, '/maternar'), [redirectToRaw])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (loading) return

      const cleanEmail = String(email || '').trim().toLowerCase()
      if (!cleanEmail || !cleanEmail.includes('@')) {
        toast.danger('Digite um e-mail válido.')
        return
      }

      setLoading(true)
      try {
        const siteUrl = getSiteUrl()
        if (!siteUrl) {
          toast.danger('Não foi possível detectar a URL do site. Verifique NEXT_PUBLIC_SITE_URL.')
          return
        }

        // O link de recovery deve voltar para uma rota pública nossa
        const redirectUrl = `${siteUrl}/auth/reset?redirectTo=${encodeURIComponent(redirectTo)}`

        const supabase = supabaseBrowser()
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        })

        if (error) {
          toast.danger(error.message || 'Não foi possível enviar o e-mail de recuperação.')
          return
        }

        setSent(true)
        toast.success('Enviamos um link de recuperação para seu e-mail.')
      } catch (err) {
        console.error('[RecoverPassword] Unexpected error:', err)
        toast.danger('Ocorreu um erro inesperado. Tente novamente.')
      } finally {
        setLoading(false)
      }
    },
    [email, loading, redirectTo]
  )

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
            RECUPERAÇÃO DE SENHA
          </p>

          <h1 className="text-xl font-semibold text-[#545454]">Esqueceu sua senha?</h1>

          <p className="text-[13px] text-[#6A6A6A] leading-relaxed">
            Digite seu e-mail. Vamos enviar um link para você criar uma nova senha.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#545454]" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-[14px] text-[#545454] outline-none focus:border-[#fd2597]"
              placeholder="seuemail@exemplo.com"
              disabled={loading || sent}
            />
          </div>

          <button
            type="submit"
            disabled={loading || sent}
            className={[
              'w-full rounded-2xl px-4 py-3 text-[13px] font-semibold transition',
              loading || sent
                ? 'bg-[#ffd8e6] text-[#b8236b] opacity-80'
                : 'bg-[#ff005e] text-white hover:opacity-95',
            ].join(' ')}
          >
            {sent ? 'E-mail enviado' : loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>

          <div className="pt-2 flex items-center justify-between">
            <Link
              href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="text-[12px] font-semibold text-[#545454] underline underline-offset-4 hover:text-[#000]"
            >
              Voltar para login
            </Link>

            <Link
              href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="text-[12px] font-semibold text-[#fd2597] underline underline-offset-4 hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>

          {sent ? (
            <div className="mt-4 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/60 px-4 py-3">
              <p className="text-[13px] font-semibold text-[#545454]">Pronto.</p>
              <p className="mt-1 text-[12px] text-[#6A6A6A] leading-relaxed">
                Abra seu e-mail e clique no link para redefinir a senha. Se não encontrar, verifique o spam.
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  )
}
