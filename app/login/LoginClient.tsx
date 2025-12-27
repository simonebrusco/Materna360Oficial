// app/login/LoginClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
    // leitura simples e segura: middleware decide pelo cookie
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
  const supabase = useMemo(() => createClientComponentClient(), [])

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = safeInternalRedirect(redirectToRaw, '/meu-dia')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [uiError, setUiError] = useState<UiError | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return

      // Regra oficial (P28/P28.5): decisão pelo cookie
      const seen = hasSeenWelcomeCookie()

      if (!seen) {
        router.replace(`/bem-vinda?next=${encodeURIComponent(redirectTo)}`)
      } else {
        router.replace(redirectTo)
      }
    })
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

    // Após login: decisão pelo cookie (middleware + BemVindaClient)
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
        emai
