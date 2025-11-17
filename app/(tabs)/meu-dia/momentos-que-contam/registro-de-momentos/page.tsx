'use client'

import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'

interface Card {
  id: string
  icon: string
  title: string
  subtitle: string
  href: string
}

const CARDS: Card[] = [
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
          Cada momento com seu filho é precioso. Crie seu acervo de lembranças que contam a história da sua maternidade.
        </p>
      </div>

      <ClientOnly>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
          {CARDS.map((card, index) => (
            <Reveal key={card.id} delay={index * 50}>
              <Link href={card.href} className="block h-full">
                <SoftCard className="rounded-3xl p-5 sm:p-6 flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] flex items-center justify-center">
                      <AppIcon name={card.icon as any} size={24} className="text-primary" decorative />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#2f3a56] mb-1">{card.title}</h3>
                      <p className="text-sm text-[#545454]">{card.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-auto">
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1">Registrar →</span>
                  </div>
                </SoftCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
