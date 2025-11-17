'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface AtividadeCard {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
}

const ATIVIDADE_CARDS: AtividadeCard[] = [
  {
    id: 'ideias-5-minutos',
    icon: 'zap',
    title: 'Ideias em 5 minutos',
    subtitle: 'Brincadeiras super rápidas que divertem na hora.',
    href: '#',
  },
  {
    id: 'conexao-10-minutos',
    icon: 'heart',
    title: 'Conexão em 10 minutos',
    subtitle: 'Atividades que fortalecem o vínculo em pouco tempo.',
    href: '#',
  },
  {
    id: 'brincadeiras-calmas',
    icon: 'sparkles',
    title: 'Brincadeiras calmas',
    subtitle: 'Para momentos antes de dormir ou pausa do dia.',
    href: '#',
  },
  {
    id: 'desafios-divertidos',
    icon: 'smile',
    title: 'Desafios divertidos',
    subtitle: 'Propostas lúdicas para explorar juntos.',
    href: '#',
  },
]

export default function AtividadesCurtinhasPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Atividades Curtinhas"
      subtitle="Brincadeiras rápidas para criar presença em poucos minutos."
    >
      <div className="max-w-2xl mb-6 md:mb-8">
        <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
          Aqui você encontra brincadeiras e atividades que cabem perfeitamente nos poros da rotina — aqueles minutinhos entre tarefas, esperando na fila, ou antes de dormir. Escolha uma ideia e aproveite para estar presente com seu filho.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {ATIVIDADE_CARDS.map((card) => (
          <CuidarFeatureCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            href={card.href}
            cardId={card.id}
          />
        ))}
      </div>
    </PageTemplate>
  )
}
