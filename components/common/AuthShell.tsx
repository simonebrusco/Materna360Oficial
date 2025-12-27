// components/common/AuthShell.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import LegalFooter from '@/components/common/LegalFooter'

type AuthShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  showBackToHome?: boolean
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showBackToHome = false,
}: AuthShellProps) {
  return (
    <main className="min-h-[100dvh] bg-[#ffe1f1] bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]">
      <div className="mx-auto w-full max-w-md px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+72px)]">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 w-[180px]">
            <Image
              src="/images/LogoBranco.png"
              alt="Materna360"
              width={360}
              height={120}
              priority
            />
          </div>

          <h1 className="text-2xl font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              {subtitle}
            </p>
          ) : null}

          {showBackToHome ? (
            <div className="mt-3">
              <Link
                href="/"
                className="text-xs font-medium text-white/85 underline underline-offset-4 hover:text-white"
              >
                Voltar ao início
              </Link>
            </div>
          ) : null}
        </header>

        <section className="rounded-3xl bg-white/90 p-5 shadow-[0_20px_60px_rgba(253,37,151,0.25)] backdrop-blur">
          {children}
        </section>

        {footer ? (
          <div className="mt-4 text-center text-xs text-[#545454]">{footer}</div>
        ) : null}

        <div className="mt-6">
          <LegalFooter tone="light" />
        </div>
      </div>
    </main>
  )
}

export default AuthShell
