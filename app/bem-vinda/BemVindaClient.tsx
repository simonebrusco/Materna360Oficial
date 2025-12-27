'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SEEN_KEY = 'm360_seen_welcome_v1'

function safeInternalRedirect(
  target: string | null | undefined,
  fallback = '/meu-dia'
) {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

function setSeenWelcomeCookie() {
  try {
    document.cookie = `${SEEN_KEY}=1; path=/; max-age=31536000; samesite=lax`
  } catch {
    // silêncio intencional
  }
}

export default function BemVindaClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextRaw = searchParams.get('next')
  const nextPath = safeInternalRedirect(nextRaw, '/meu-dia')

  function handleStartMyDay() {
    setSeenWelcomeCookie()
    router.replace(nextPath || '/meu-dia')
  }

  function handleGoMaternar() {
    setSeenWelcomeCookie()
    router.replace('/maternar')
  }

  return (
    <main className="min-h-[100svh] w-full px-4 py-10">
      {/* Área rolável segura */}
      <div className="min-h-[100svh] w-full flex items-start justify-center overflow-y-auto">
        {/* Fundo com identidade, mas silencioso */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#fd2597_0%,#fde2ec_22%,#ffffff_58%,#ffffff_100%)]"
        />

        <div className="w-full max-w-[520px]">
          <div className="rounded-3xl bg-white p-7 border border-[#F5D7E5] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
            {/* Headline */}
            <h1 className="text-[28px] leading-tight font-semibold text-[#2f3a56]">
              Você não está sozinha.
              <br />
              Você está cansada.
            </h1>

            {/* Texto principal */}
            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#545454]">
              <p>
                Entre trabalho, casa, filhos e expectativas, o dia pesa — e mesmo
                fazendo o seu melhor, às vezes parece que nunca é suficiente.
              </p>

              <p>
                O{' '}
                <span className="font-semibold text-[#2f3a56]">
                  Materna360
                </span>{' '}
                não existe para te ensinar a ser uma mãe melhor. Você já é.
              </p>

              <p>
                Ele existe para te ajudar a viver a maternidade com menos culpa e
                mais leveza.
              </p>
            </div>

            {/* Pílulas de valor */}
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fa] px-4 py-3 text-[13px] text-[#545454]">
                Um jeito mais gentil de organizar o dia
              </div>
              <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fa] px-4 py-3 text-[13px] text-[#545454]">
                Um espaço que também é seu
              </div>
              <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fa] px-4 py-3 text-[13px] text-[#545454]">
                Pequenos apoios pensados para a vida real
              </div>
            </div>

            <p className="mt-5 text-[12px] text-[#545454]">
              Sem cobrança. Sem perfeição.
            </p>

            {/* CTAs */}
            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={handleStartMyDay}
                className="w-full rounded-2xl bg-[#fd2597] px-4 py-3 text-sm font-semibold text-white"
              >
                Começar pelo Meu Dia
              </button>

              <button
                type="button"
                onClick={handleGoMaternar}
                className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3 text-sm font-semibold text-[#2f3a56]"
              >
                Ir para o Maternar
              </button>
            </div>

            <p className="mt-5 text-center text-[12px] text-[#545454]/60">
              Você pode trocar de aba depois. Aqui é só para te dar um começo leve.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
