'use client'

import * as React from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard as Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageGrid } from '@/components/common/PageGrid'
import { FilterPill } from '@/components/ui/FilterPill'
import { ChildDiary } from './components/ChildDiary'
import { ChildDiaryCard } from './components/ChildDiaryCard'
import { AppointmentsMVP } from './components/AppointmentsMVP'
import { BreathAudios } from './components/BreathAudios'
import { SectionH2 } from '@/components/common/Headings'

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

      <ChildDiaryCard />

      <PageGrid>
        <Card>
          <EmptyState
            title="Check-in de bem-estar"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        </Card>

        <ChildDiary />

        <Card>
          <EmptyState
            title="Saúde & Vacinas"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        </Card>
      </PageGrid>

      <Card>
        <AppointmentsMVP storageKey="cuidar:appointments" />
      </Card>

      <Card>
        {recipesSection ?? (
          <EmptyState
            title="Receitas saudáveis"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        )}
      </Card>

      <BreathAudios />
    </PageTemplate>
  )
}
