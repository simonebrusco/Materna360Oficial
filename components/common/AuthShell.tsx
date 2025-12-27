'use client'

import Image from 'next/image'
import LegalFooter from '@/components/common/LegalFooter'

type AuthShellProps = {
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-[#fd2597] via-[#fd2597] to-[#fff7fa] px-4">
      
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/images/LogoBranco.png"
          alt="Maternar"
          width={180}
          height={48}
          priority
        />
      </div>

      {/* Texto opcional */}
      {title && (
        <h1 className="text-2xl font-semibold text-white mb-2 text-center">
          {title}
        </h1>
      )}

      {subtitle && (
        <p className="text-white/90 mb-6 text-center max-w-md">
          {subtitle}
        </p>
      )}

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        {children}
      </div>

      {/* Rodapé */}
      <div className="mt-8">
        <LegalFooter />
      </div>
    </main>
  )
}
