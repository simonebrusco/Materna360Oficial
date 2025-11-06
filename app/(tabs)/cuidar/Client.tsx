'use client'

import React, { Suspense, type ErrorInfo, type ReactNode } from 'react'

import Emoji from '@/components/ui/Emoji'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import BreathTimer from '@/components/blocks/BreathTimer'
import { CareJourneys } from '@/components/blocks/CareJourneys'
import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'
import { MindfulnessCollections } from '@/components/blocks/MindfulnessCollections'
import { OrganizationTips } from '@/components/features/OrganizationTips'
import ProfessionalsSection from '@/components/support/ProfessionalsSection'

interface CuidarClientProps {
  firstName?: string
  initialProfessionalId?: string
}

function SectionSkeleton({ className = '' }: { className?: string }) {
  return <div className={`section-card h-44 animate-pulse bg-white/70 ${className}`} aria-hidden />
}

class SectionErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Falha ao renderizar seção em Cuide-se:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="section-card border border-primary/30 bg-primary/10 text-sm text-primary">
          Algo não carregou corretamente. Tente recarregar a página.
        </div>
      )
    }

    return this.props.children
  }
}

function GuardedSection({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <SectionErrorBoundary>{children}</SectionErrorBoundary>
    </Suspense>
  )
}

export default function CuidarClient({ firstName = '', initialProfessionalId }: CuidarClientProps) {
  const trimmedName = firstName.trim()
  const hasName = trimmedName.length > 0
  const subheadingTail =
    'seu bem-estar é prioridade: reserve momentos de pausa, respire com consciência e nutra o corpo com carinho.'
  const subheading = hasName ? `${trimmedName}, ${subheadingTail}` : `Seu bem-estar é prioridade: reserve momentos de pausa, respire com consciência e nutra o corpo com carinho.`

  return (
    <div className="relative page-shell pb-32 pt-12">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,216,230,0.45),transparent)]"
      />

      <div className="relative space-y-12">
        <Reveal>
          <div className="space-y-4">
            <span className="section-eyebrow eyebrow-capsule">Autocuidado</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <AppIcon name="leaf" size={28} className="text-primary" decorative />
                <h1 className="section-title md:text-4xl">
                  Cuide-se
                </h1>
              </div>
              {hasName && (
                <span
                  className="inline-flex max-w-[12ch] items-center truncate rounded-full bg-support-1/10 px-3 py-1 text-sm font-semibold text-support-1"
                  aria-label={`Mãe: ${trimmedName}`}
                  title={trimmedName}
                >
                  {trimmedName}
                </span>
              )}
            </div>
            <p className="section-subtitle max-w-3xl" aria-label={subheading}>
              {subheading}
            </p>
          </div>
        </Reveal>

        <GuardedSection>
          <Reveal delay={80}>
            <BreathTimer />
          </Reveal>
        </GuardedSection>

        <GuardedSection>
          <section className="space-y-4" aria-label="Mindfulness para Mães">
            <Reveal>

              <p className="section-subtitle max-w-2xl">
                Um espaço para desacelerar, ouvir sua respiração e acolher as emoções do dia.
              </p>

              <div className="space-y-2">
                <h2 className="section-title">Mindfulness para Mães</h2>
                <p className="section-subtitle max-w-2xl">
                  Um espaço para desacelerar, ouvir sua respiração e acolher as emoções do dia.
                </p>
              </div>

            </Reveal>
            <MindfulnessCollections />
          </section>
        </GuardedSection>

        <GuardedSection>
          <Reveal delay={140}>
            <CareJourneys />
          </Reveal>
        </GuardedSection>

        <GuardedSection>
          <HealthyRecipesSection />
        </GuardedSection>

        <GuardedSection>
          <Reveal delay={200}>
            <OrganizationTips />
          </Reveal>
        </GuardedSection>

        <GuardedSection>
          <ProfessionalsSection />
        </GuardedSection>
      </div>
    </div>
  )
}
