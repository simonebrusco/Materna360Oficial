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
    <div className="mx-auto max-w-[1040px] px-4 py-6 pb-24 md:px-6">
      <HeroSection />

      <NavigationHub
        onCuidarDeMim={handleCuidarDeMim}
        onCuidarDoFilho={handleCuidarDoFilho}
        onOrganizarRotina={handleOrganizarRotina}
        onAprenderEBrincar={handleAprenderEBrincar}
        onMinhasConquistas={handleMinhasConquistas}
        onPlanosPremium={handlePlanosPremium}
      />

      <div className="space-y-6 md:space-y-8 mt-6 md:mt-8">
        <div id="maternar-resumo">
          <SectionWrapper
            title="Resumo da sua semana"
            subtitle="Um olhar carinhoso sobre como você tem se sentido."
          >
            <WeeklySummary />
          </SectionWrapper>
        </div>

        <div id="maternar-habitos">
          <SectionWrapper
            title="Hábitos maternos"
            subtitle="Pequenas práticas que sustentam uma rotina mais leve e conectada."
          >
            <HabitosMaternos />
          </SectionWrapper>
        </div>

        <div id="maternar-momentos">
          <SectionWrapper
            title="Momentos com os filhos"
            subtitle="Pequenas memórias que contam a grande história da sua maternidade."
          >
            <MomentsWithKids />
          </SectionWrapper>
        </div>

        <div id="maternar-evolucao">
          <SectionWrapper
            title="Sua evolução emocional"
            subtitle="Acompanhe padrões, mudanças e conquistas ao longo dos dias."
          >
            <EmotionalAnalytics />
          </SectionWrapper>
        </div>

        <SectionWrapper
          title="Diário da mãe"
          subtitle="Um espaço seguro para colocar em palavras aquilo que você sente."
        >
          <MothersDiary />
        </SectionWrapper>

        <SectionWrapper
          title="Trilhas premium"
          subtitle="Caminhos guiados para semanas mais leves e conscientes."
        >
          <PremiumTrails />
        </SectionWrapper>
      </div>
    </div>
  )
}
