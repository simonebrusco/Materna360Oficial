'use client'

import React, { useEffect, useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { Reveal } from '@/components/ui/Reveal'
import {
  getProfessionals,
  type ProfessionalApi,
  type SpecialtyId,
} from '@/app/lib/profissionais'

type SpecialtyFilterId = 'todos' | SpecialtyId
type Professional = ProfessionalApi

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('')
}

function trackProfessionalEvent(
  type: 'view' | 'whatsapp_click',
  professional: Professional,
) {
  if (typeof window === 'undefined') return
  console.log('[Materna360][Materna+] Event:', type, {
    id: professional.id,
    name: professional.name,
  })
}

const SPECIALTIES: { id: SpecialtyFilterId; label: string }[] = [
  { id: 'todos', label: 'Todos os profissionais' },
  { id: 'psicologia-infantil', label: 'Psicologia infantil' },
  { id: 'psicopedagogia', label: 'Psicopedagogia' },
  { id: 'nutricao-materno-infantil', label: 'Nutrição materno-infantil' },
  { id: 'sono-infantil', label: 'Sono infantil' },
  { id: 'parentalidade-familia', label: 'Parentalidade & família' },
]

type HubSectionId = 'premium' | 'profissionais' | 'comunidade' | 'servicos'

const HUB_SECTIONS: { id: HubSectionId; label: string }[] = [
  { id: 'premium', label: 'Premium' },
  { id: 'profissionais', label: 'Profissionais' },
  { id: 'comunidade', label: 'Comunidade' },
  { id: 'servicos', label: 'Serviços' },
]

export default function MaternaPlusPage() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyFilterId>('todos')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<HubSectionId>('premium')

  useEffect(() => {
    let isMounted = true
    async function loadProfessionals() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProfessionals()
        if (isMounted) setProfessionals(data)
      } catch {
        if (isMounted)
          setError('Não conseguimos carregar a lista de profissionais agora.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadProfessionals()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredProfessionals =
    selectedSpecialty === 'todos'
      ? professionals
      : professionals.filter(p => p.specialtyId === selectedSpecialty)

  const handleContactProfessional = () => {
    if (!selectedProfessional) return
    trackProfessionalEvent('whatsapp_click', selectedProfessional)
    window.open(selectedProfessional.whatsappUrl, '_blank')
  }

  const scrollTo = (id: HubSectionId) => {
    const el = document.getElementById(`materna-plus-${id}`)
    if (!el) return
    const headerOffset = 88
    const rect = el.getBoundingClientRect()
    window.scrollTo({
      top: rect.top + window.scrollY - headerOffset,
      behavior: 'smooth',
    })
  }

  return (
    <PageTemplate
      label="MATERNAR"
      title="Materna+"
      subtitle="Profissionais parceiros, serviços especiais e um caminho premium em construção — sem enrolação, no seu tempo."
    >
      <ClientOnly>
        <div className="pt-3 md:pt-4 pb-12 space-y-8 md:space-y-10 max-w-5xl mx-auto">
          {/* HERO */}
          <Reveal>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="space-y-5 md:space-y-6 max-w-3xl">
                <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  MATERNA+ · PORTAL PREMIUM
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Escolha um bloco e vá direto ao ponto.
                </h2>
                <p className="text-sm md:text-[15px] text-white/85 leading-relaxed">
                  Menu rápido para navegar entre Premium, Profissionais, Comunidade e Serviços.
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* PREMIUM */}
          <Reveal>
            <SoftCard
              id="materna-plus-premium"
              className="rounded-3xl border border-[#F5D7E5] bg-[#ffe1f1] p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <header className="space-y-2">
                <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-white/90">
                  PREMIUM
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Trilhas e conteúdos — no seu tempo.
                </h2>
                <p className="text-sm md:text-[15px] text-white/85 max-w-2xl leading-relaxed">
                  Um caminho claro para quando você quer sair do modo “caça”.
                </p>
              </header>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="materna-plus" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
