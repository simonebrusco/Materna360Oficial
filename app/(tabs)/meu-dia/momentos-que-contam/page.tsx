'use client'

import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'

interface ConnectionCard {
  id: string
  icon: string
  title: string
  subtitle: string
  cta: string
  href: string
}

const CONNECTION_CARDS: ConnectionCard[] = [
  {
    id: 'conexao-afetuosa',
    icon: 'hand-heart',
    title: 'Conexão Afetuosa',
    subtitle: 'Pequenos rituais de carinho para fortalecer o vínculo.',
    cta: 'Ver ideias →',
    href: '/descobrir/aprender-brincando',
  },
  {
    id: 'atividades-curtinhas',
    icon: 'sparkles',
    title: 'Atividades Curtinhas',
    subtitle: 'Brincadeiras rapidinhas para momentos do dia.',
    cta: 'Explorar →',
    href: '/descobrir/aprender-brincando',
  },
  {
    id: 'registro-momentos',
    icon: 'camera',
    title: 'Registro de Momentos',
    subtitle: 'Guarde memórias especiais do seu dia com seu filho.',
    cta: 'Registrar →',
    href: '/eu360/minha-jornada',
  },
  {
    id: 'guia-desenvolvimento',
    icon: 'book-open',
    title: 'Guia do Desenvolvimento',
    subtitle: 'Acompanhe a fase do seu filho com orientações personalizadas.',
    cta: 'Ver guia →',
    href: '/eu360/minha-jornada?focus=guia-desenvolvimento',
  },
]

export default function MomentosQueContamPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Momentos que Contam"
      subtitle="Pequenos gestos que criam memórias para a vida toda."
    >
      <ClientOnly>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl">
          {CONNECTION_CARDS.map((card, index) => (
            <Reveal key={card.id} delay={index * 50}>
              <Link href={card.href} className="block h-full">
                <SoftCard
                  className="rounded-3xl p-5 sm:p-6 flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg"
                >
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
