'use client'

import { Reveal } from '@/components/ui/Reveal'
import { BreathTimer } from '@/components/blocks/BreathTimer'
import { CareJourneys } from '@/components/blocks/CareJourneys'
import { HealthyRecipesSection } from '@/components/blocks/HealthyRecipes'
import { MindfulnessCollections } from '@/components/blocks/MindfulnessCollections'
import { OrganizationTips } from '@/components/features/OrganizationTips'
import { ProfessionalsSection } from '@/components/support/ProfessionalsSection'

interface CuidarClientProps {
  firstName?: string
  initialProfessionalId?: string
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
            <span className="section-eyebrow">Autocuidado</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-3xl">🌿</span>
                <h1 className="section-title md:text-4xl" aria-label="Cuide-se">
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
            <p className="section-subtitle max-w-3xl text-balance" aria-label={subheading}>
              {subheading}
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <BreathTimer />
        </Reveal>

        <section className="space-y-4">
          <Reveal>
            <div className="space-y-2">
              <h2 className="section-title flex items-center gap-2">
                <span aria-hidden="true">🎧</span>
                <span>Mindfulness para Mães</span>
              </h2>
              <p className="section-subtitle max-w-2xl">
                Um espaço para desacelerar, ouvir sua respiração e acolher as emoções do dia.
              </p>
            </div>
          </Reveal>
          <MindfulnessCollections />
        </section>

        <Reveal delay={140}>
          <CareJourneys />
        </Reveal>

        <HealthyRecipesSection />

        <Reveal delay={200}>
          <OrganizationTips />
        </Reveal>

        <ProfessionalsSection initialProfessionalId={initialProfessionalId} />
      </div>
    </div>
  )
}
