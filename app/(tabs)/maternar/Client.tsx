'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

import { HeroSection } from './components/HeroSection'
import { WeeklySummary } from './components/WeeklySummary'
import { MomentsWithKids } from './components/MomentsWithKids'
import { EmotionalAnalytics } from './components/EmotionalAnalytics'
import { MothersDiary } from './components/MothersDiary'
import { NavigationHub } from './components/NavigationHub'
import { PremiumTrails } from './components/PremiumTrails'
import { HabitosMaternos } from './components/HabitosMaternos'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { ClientOnly } from '@/components/common/ClientOnly'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function scrollToSection(id: string) {
  if (typeof window === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function MaternarClient() {
  const router = useRouter()

  const handleCuidarDeMim = () => {
    scrollToSection('maternar-habitos')
  }

  const handleCuidarDoFilho = () => {
    scrollToSection('maternar-momentos')
  }

  const handleOrganizarRotina = () => {
    router.push('/meu-dia')
  }

  const handleAprenderEBrincar = () => {
    router.push('/descobrir')
  }

  const handleMinhasConquistas = () => {
    scrollToSection('maternar-evolucao')
  }

  const handlePlanosPremium = () => {
    router.push('/eu360')
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <HeroSection />

      <NavigationHub
        onCuidarDeMim={handleCuidarDeMim}
        onCuidarDoFilho={handleCuidarDoFilho}
        onOrganizarRotina={handleOrganizarRotina}
        onAprenderEBrincar={handleAprenderEBrincar}
        onMinhasConquistas={handleMinhasConquistas}
        onPlanosPremium={handlePlanosPremium}
      />

      <div id="maternar-resumo">
        <SectionWrapper
          title="Resumo da sua semana"
          description="Um olhar carinhoso sobre como você tem se sentido."
        >
          <ClientOnly>
            <WeeklySummary />
          </ClientOnly>
        </SectionWrapper>
      </div>

      <div id="maternar-habitos">
        <SectionWrapper
          title="Hábitos maternos"
          description="Pequenas práticas que sustentam uma rotina mais leve e consciente."
        >
          <HabitosMaternos />
        </SectionWrapper>
      </div>

      <div id="maternar-momentos">
        <SectionWrapper
          title="Momentos com os filhos"
          description="Pequenas memórias que contam a grande história da sua maternidade."
        >
          <MomentsWithKids />
        </SectionWrapper>
      </div>

      <div id="maternar-evolucao">
        <SectionWrapper
          title="Sua evolução emocional"
          description="Acompanhe padrões, mudanças e conquistas ao longo dos dias."
        >
          <ClientOnly>
            <EmotionalAnalytics />
          </ClientOnly>
        </SectionWrapper>
      </div>

      <SectionWrapper
        title="Diário da mãe"
        description="Um espaço seguro para colocar em palavras aquilo que você sente."
      >
        <ClientOnly>
          <MothersDiary />
        </ClientOnly>
      </SectionWrapper>

      <SectionWrapper
        title="Trilhas premium"
        description="Caminhos guiados para semanas mais leves e conscientes."
      >
        <ClientOnly>
          <PremiumTrails />
        </ClientOnly>
      </SectionWrapper>
    </div>
  )
}
