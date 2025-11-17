'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface RegistroCard {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
}

const REGISTRO_CARDS: RegistroCard[] = [
  {
    id: 'memorias-dia',
    icon: 'camera',
    title: 'Memórias do dia',
    subtitle: 'Guarde as imagens e momentos que marcaram.',
    href: '#',
  },
  {
    id: 'frases-lembrar',
    icon: 'bookmark',
    title: 'Frases para lembrar',
    subtitle: 'Aquelas coisas que você quer guardar para sempre.',
    href: '#',
  },
  {
    id: 'diario-afetivo',
    icon: 'book-open',
    title: 'Diário afetivo',
    subtitle: 'Um espaço para refletir sobre seus encontros.',
    href: '#',
  },
  {
    id: 'marcos-crescimento',
    icon: 'star',
    title: 'Marcos de crescimento',
    subtitle: 'Acompanhe os pequenos avanços de seu filho.',
    href: '#',
  },
]

export default function RegistroDeMomentosPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Registro de Momentos"
      subtitle="Um espaço para guardar lembranças especiais do dia a dia."
    >
      <div className="max-w-2xl mb-6 md:mb-8">
        <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
          Cada momento com seu filho é precioso. Aqui você pode registrar fotos, frases memoráveis, pequenos avanços e sentimentos. Crie seu acervo de lembranças que contam a história da sua maternidade.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {REGISTRO_CARDS.map((card) => (
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
