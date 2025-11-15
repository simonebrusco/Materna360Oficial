'use client'

import React from 'react'
import { useProfile } from '@/app/hooks/useProfile'

export function HeroSection() {
  const profile = useProfile()
  const motherName = profile?.name || 'Mãe'

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-complement/30 p-6 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-support-1 mb-2">
        Olá, {motherName}
      </h1>
      <p className="text-base md:text-lg text-support-2">
        Esse é o seu espaço de acolhimento, evolução e conexão.
      </p>
    </div>
  )
}
