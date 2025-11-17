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
    id: 'ritual-acolhimento',
    icon: 'heart',
    title: 'Ritual de Acolhimento',
    subtitle: 'Gestos simples para começar e terminar o dia com carinho.',
    cta: 'Ver ideias →',
    href: '#',
  },
  {
    id: 'momento-afetuoso',
    icon: 'sparkles',
    title: 'Momento Afetuoso',
    subtitle: 'Pequenos toques e olhares que criam presença real.',
    cta: 'Explorar →',
    href: '#',
  },
  {
    id: 'toque-conforta',
    icon: 'smile',
    title: 'Toque que Conforta',
    subtitle: 'Maneiras de acalmar, acolher e transmitir segurança.',
    cta: 'Ver sugestões →',
    href: '#',
  },
  {
    id: '5-minutinhos',
    icon: 'calendar',
    title: '5 Minutinhos Juntos',
    subtitle: 'Propostas rápidas para reforçar o vínculo no dia a dia.',
    cta: 'Ver atividades →',
    href: '#',
  },
]

export default function ConexaoAfetuosaPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Conexão Afetuosa"
      subtitle="Pequenos rituais que fortalecem o vínculo todos os dias."
    >
      <div className="max-w-2xl mb-6 md:mb-8">
        <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
          Este é o seu espaço para encontrar pequenos gestos de carinho, presença e conexão com o seu filho — mesmo nos dias corridos. Escolha um dos rituais abaixo para criar um momento especial hoje.
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
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1">{card.cta}</span>
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
