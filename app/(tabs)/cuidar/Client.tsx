'use client'

import * as React from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard as Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageGrid } from '@/components/common/PageGrid'
import { FilterPill } from '@/components/ui/FilterPill'

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
            text="Registre energia, humor e sinais do dia para receber sugestões."
          />
        </Card>

        <Card>
          <EmptyState
            title="Diário da criança"
            text="Alimentação, sono, humor e observações em um só lugar."
          />
        </Card>

        <Card>
          <EmptyState
            title="Saúde & Vacinas"
            text="Acompanhe vacinas, consultas e lembretes importantes."
          />
        </Card>
      </PageGrid>

      <Card>
        {recipesSection ?? (
          <EmptyState
            title="Receitas saudáveis"
            text="Personalizadas para a rotina — adicione um ingrediente e receba sugestões."
          />
        )}
      </Card>

      <Card>
        <EmptyState
          title="Momento de respiro"
          text="Práticas rápidas para acalmar e recentrar."
        />
      </Card>
    </PageTemplate>
  )
}
