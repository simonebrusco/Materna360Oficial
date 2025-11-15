'use client'

import React from 'react'
import { HeroSection } from './components/HeroSection'
import { WeeklySummary } from './components/WeeklySummary'
import { MomentsWithKids } from './components/MomentsWithKids'
import { EmotionalAnalytics } from './components/EmotionalAnalytics'
import { MothersDiary } from './components/MothersDiary'
import { NavigationHub } from './components/NavigationHub'
import { PremiumTrails } from './components/PremiumTrails'

export function MaternarClient() {
  return (
    <main className="flex flex-col gap-6 px-4 py-6 pb-24 mx-auto max-w-[1040px] md:px-6">
      <HeroSection />
      <WeeklySummary />
      <MomentsWithKids />
      <EmotionalAnalytics />
      <MothersDiary />
      <NavigationHub />
      <PremiumTrails />
    </main>
  )
}
