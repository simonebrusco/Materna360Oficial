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
          <EmptyState
            title="Diário da criança"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
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
  )
}
