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
  cta: string
  href: string
}

const CARDS: Card[] = [
  {
    id: 'checkin-rapido',
    icon: 'smile',
    title: 'Check-in Rápido',
    subtitle: 'Como você está se sentindo agora?',
    cta: 'Registrar →',
    href: '/meu-dia/como-estou-hoje/checkin',
  },
  {
    id: 'humor-semana',
    icon: 'calendar-clock',
    title: 'Humor da Semana',
    subtitle: 'Veja padrões de como você tem se sentido.',
    cta: 'Ver resumo →',
    href: '/meu-dia/como-estou-hoje/humor-semana',
  },
  {
    id: 'niveis-energia',
    icon: 'zap',
    title: 'Níveis de Energia',
    subtitle: 'Registre se está esgotada ou recarregada.',
    cta: 'Registrar →',
    href: '/meu-dia/como-estou-hoje/energia',
  },
  {
    id: 'notas-dia',
    icon: 'book-open',
    title: 'Notas do Dia',
    subtitle: 'Desabafe em poucas palavras.',
    cta: 'Escrever →',
    href: '/meu-dia/como-estou-hoje/notas',
  },
]

export default function ComoEstouHojePage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Humor e energia com mais consciência."
    >
      <ClientOnly>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl">
          {CARDS.map((card, index) => (
            <Reveal key={card.id} delay={index * 50}>
              <Link href={card.href} className="block h-full">
                <SoftCard className="rounded-3xl p-5 sm:p-6 flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] flex items-center justify-center">
                      <AppIcon
                        name={card.icon as any}
                        size={24}
                        className="text-primary"
                        decorative
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#2f3a56] mb-1">
                        {card.title}
                      </h3>
                      <p className="text-sm text-[#545454]">{card.subtitle}</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex justify-end mt-auto">
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                      {card.cta}
                    </span>
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
