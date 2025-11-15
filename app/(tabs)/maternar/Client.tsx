'use client'

import React from 'react'
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

export function MaternarClient() {
  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 pb-24 md:px-6">
      <HeroSection />

      <div className="space-y-6 md:space-y-8 mt-6 md:mt-8">
        <SectionWrapper
          title="Resumo da sua semana"
          subtitle="Um olhar carinhoso sobre como você tem se sentido."
        >
          <WeeklySummary />
        </SectionWrapper>

        <SectionWrapper
          title="Hábitos maternos"
          subtitle="Pequenas práticas que sustentam uma rotina mais leve e conectada."
        >
          <HabitosMaternos />
        </SectionWrapper>

        <SectionWrapper
          title="Momentos com os filhos"
          subtitle="Pequenas memórias que contam a grande história da sua maternidade."
        >
          <MomentsWithKids />
        </SectionWrapper>

        <SectionWrapper
          title="Sua evolução emocional"
          subtitle="Acompanhe padrões, mudanças e conquistas ao longo dos dias."
        >
          <EmotionalAnalytics />
        </SectionWrapper>

        <SectionWrapper
          title="Diário da mãe"
          subtitle="Um espaço seguro para colocar em palavras aquilo que você sente."
        >
          <MothersDiary />
        </SectionWrapper>

        <SectionWrapper
          title="Seu hub de cuidado"
          subtitle="Acesse conteúdos, ideias e trilhas pensadas para você."
        >
          <NavigationHub />
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
