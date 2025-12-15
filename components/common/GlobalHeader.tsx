'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { AppLogo } from '@/components/ui/AppLogo'
import AppIcon from '@/components/ui/AppIcon'

type PersonaResult = {
  label?: string
  persona?: string
  microCopy?: string
  updatedAtISO?: string
}

const LS_EU360_PERSONA = 'eu360_persona_v1'

function safeReadPersonaFromLS(): PersonaResult | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(LS_EU360_PERSONA)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersonaResult
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Global translucent header that appears on all tabs
 * - Left: Materna360 logo
 * - Right: Personalized identity chip (Olá + Vibe) linking to /eu360
 */
export function GlobalHeader() {
  const { name, isLoading } = useProfile()

  const firstName = useMemo(() => {
    const n = (name || '').trim()
    if (!n) return ''
    return n.split(' ')[0] || ''
  }, [name])

  const [personaLabel, setPersonaLabel] = useState<string>('')

  useEffect(() => {
    const saved = safeReadPersonaFromLS()
    setPersonaLabel((saved?.label || '').trim())
  }, [])

  // Atualiza o chip se o LS mudar (quando a usuária conclui o questionário)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_EU360_PERSONA) return
      const saved = safeReadPersonaFromLS()
      setPersonaLabel((saved?.label || '').trim())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const vibeText = personaLabel || 'Definir vibe'
  const helloText = firstName ? `Olá, ${firstName}` : 'Olá'

  return (
    <header
      className="
        sticky top-0 z-50
        bg-transparent
        backdrop-blur-lg
        border-b border-white/40
      "
    >
      <div className="mx-auto w-full px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <AppLogo width={128} height={32} />

        {/* Right: Personalized chip */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <ClientOnly>
              <Link
                href="/eu360"
                prefetch={false}
                aria-label="Abrir Eu360"
                className="
                  group
                  inline-flex items-center gap-3
                  rounded-full
                  border border-white/45
                  bg-white/12
                  px-3 py-2
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-white/18
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white/50
                "
              >
                <div className="hidden sm:flex flex-col leading-tight text-right">
                  <p className="text-[12px] font-semibold text-white/95">
                    {getTimeGreeting(firstName || '') || helloText}
                  </p>
                  <p className="text-[10px] text-white/80">
                    Vibe: <span className="font-semibold text-white/90">{vibeText}</span>
                  </p>
                </div>

                {/* Compact (mobile) */}
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-white/95">{helloText}</span>
                  <span className="text-[10px] text-white/80">•</span>
                  <span className="text-[11px] font-semibold text-white/90">{vibeText}</span>
                </div>

                <span
                  className="
                    grid h-9 w-9 place-items-center rounded-full
                    bg-white/20
                    border border-white/35
                    transition
                    group-hover:bg-white/28
                  "
                  aria-hidden
                >
                  <AppIcon name="sparkles" size={18} className="text-white" decorative />
                </span>
              </Link>
            </ClientOnly>
          )}
        </div>
      </div>
    </header>
  )
}
