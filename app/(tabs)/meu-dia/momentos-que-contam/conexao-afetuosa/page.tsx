'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface ConexaoCard {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  ctaText: string
  href: string
}

const CONEXAO_CARDS: ConexaoCard[] = [
  {
    id: 'ritual-acolhimento',
    icon: 'heart',
    title: 'Ritual de Acolhimento',
    subtitle: 'Gestos simples para começar e terminar o dia com carinho.',
    ctaText: 'Ver ideias',
    href: '/meu-dia/momentos-que-contam/conexao-afetuosa/ritual-de-acolhimento',
  },
  {
    id: 'momento-afetuoso',
    icon: 'sparkles',
    title: 'Momento Afetuoso',
    subtitle: 'Pequenos toques e olhares que criam presença real.',
    ctaText: 'Explorar',
    href: '/meu-dia/momentos-que-contam/conexao-afetuosa/momento-afetuoso',
  },
  {
    id: 'toque-conforta',
    icon: 'smile',
    title: 'Toque que Conforta',
    subtitle: 'Maneiras de acalmar, acolher e transmitir segurança.',
    ctaText: 'Ver sugestões',
    href: '/meu-dia/momentos-que-contam/conexao-afetuosa/toque-que-conforta',
  },
  {
    id: '5-minutinhos',
    icon: 'calendar',
    title: '5 Minutinhos Juntos',
    subtitle: 'Propostas rápidas para reforçar o vínculo no dia a dia.',
    ctaText: 'Ver atividades',
    href: '/meu-dia/momentos-que-contam/conexao-afetuosa/5-minutinhos',
  },
]

export default function ConexaoAfetuosaPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Conexão Afetuosa"
      subtitle="Pequenos rituais que fortalecem o vínculo todos os dias."
    >
      {/* Intro paragraph */}
      <div className="max-w-2xl mb-6 md:mb-8">
        <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
          Este é o seu espaço para encontrar pequenos gestos de carinho, presença e conexão com o seu filho — mesmo nos dias corridos. Escolha um dos rituais abaixo para criar um momento especial hoje.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {CONEXAO_CARDS.map((card) => (
          <CuidarFeatureCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            href={card.href}
            cardId={card.id}
            ctaText={card.ctaText}
          />
        ))}
      </div>
    </PageTemplate>
  )
}
