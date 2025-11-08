'use client'

import * as React from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard as Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageGrid } from '@/components/common/PageGrid'
import { FilterPill } from '@/components/ui/FilterPill'
import { QuickChildLogs } from '@/components/blocks/QuickChildLogs'

type Props = {
  recipesSection?: React.ReactNode
}

export default function CuidarClient({ recipesSection }: Props) {
  return (
    <PageTemplate
      title="Cuidar"
      subtitle="Saúde física, emocional e segurança — no ritmo da vida real."
    >
      <Card>
        <div className="flex flex-wrap gap-2">
          <FilterPill active>Hoje</FilterPill>
          <FilterPill>Semana</FilterPill>
          <FilterPill>Bem-estar</FilterPill>
          <FilterPill>Sono</FilterPill>
          <FilterPill>Consultas</FilterPill>
        </div>
      </Card>

      <PageGrid>
        <Card>
          <EmptyState
            title="Check-in de bem-estar"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-support-1">Diário da criança</h3>
            <p className="text-sm text-support-2 mt-1">Registre alimentação, sono e humor em tempo real</p>
          </div>

          <QuickChildLogs />
        </Card>

        <Card>
          <EmptyState
            title="Saúde & Vacinas"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        </Card>
      </PageGrid>

      <Card>
        {recipesSection ?? (
          <EmptyState
            title="Receitas saudáveis"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        )}
      </Card>

      <Card>
        <EmptyState
          title="Momento de respiro"
          text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
        />
      </Card>
    </PageTemplate>

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
