'use client'

import * as React from 'react'
import Image from 'next/image'
import LegalFooter from '@/components/common/LegalFooter'

type AuthShellProps = {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <main className="min-h-[100svh] w-full flex flex-col items-center justify-center px-4 py-10">
      {/* Fundo silencioso com identidade (sem “gritar”) */}
      <div
        aria-hidden="true"
       className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#fd2597_0%,#fde2ec_22%,#ffffff_55%,#ffffff_100%)]"
      />

      {/* Container */}
      <div className="w-full max-w-[420px]">
        {/* Logo fora do card (presença + respiro) */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo-materna.png"
            alt="Materna360"
             width={170}
  height={54}
            priority
            className="h-auto w-[180px] select-none"
          />
        </div>

        {/* Card premium/silencioso */}
       <div className="rounded-3xl bg-white p-6 border border-[#F5D7E5] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
          {(title || subtitle) && (
            <header className="mb-5">
              {title && (
                <h1 className="text-[22px] leading-tight font-semibold text-[#2f3a56]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-[14px] leading-relaxed text-[#545454]">
                  {subtitle}
                </p>
              )}
            </header>
          )}

          {children}
        </div>

        {/* Rodapé legal discreto */}
        <div className="mt-8 opacity-50 text-[11px]">
          <LegalFooter />
        </div>
      </div>
    </main>
  )
}
