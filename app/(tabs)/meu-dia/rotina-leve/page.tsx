'use client'

import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface CardItem {
  id: string
  icon: KnownIconName
  title: string
  description: string
  href?: string
}

interface CardGroup {
  label: string
  subtitle?: string
  cards: CardItem[]
}

const INSPIRATION_CARDS: CardItem[] = [
  {
    id: 'ideias-rapidas',
    title: 'Ideias Rápidas',
    description: 'Inspirações simples para deixar o dia mais leve.',
    icon: 'idea',
  },
  {
    id: 'receitas-inteligentes',
    title: 'Receitas Inteligentes',
    description: 'Você diz o ingrediente, eu te ajudo com o resto.',
    icon: 'sparkles',
  },
  {
    id: 'inspiracoes-do-dia',
    title: 'Inspirações do Dia',
    description: 'Uma frase e um pequeno cuidado para hoje.',
    icon: 'heart',
  },
]

const CARD_GROUPS: CardGroup[] = [
  {
    label: 'ORGANIZAÇÃO DO DIA',
    subtitle: 'Comece organizando o essencial.',
    cards: [
      {
        id: 'planejar-dia',
        title: 'Planejar o Dia',
        description: 'Comece organizando as tarefas mais importantes.',
        href: '/meu-dia?focus=planejar-o-dia',
        icon: 'calendar',
      },
      {
        id: 'rotina-casa',
        title: 'Rotina da Casa',
        description: 'Tarefas do lar com praticidade e leveza.',
        href: '/meu-dia?focus=rotina-da-casa',
        icon: 'home',
      },
    ],
  },
  {
    label: 'ROTINA DA FAMÍLIA',
    subtitle: 'Acompanhe a rotina com harmonia.',
    cards: [
      {
        id: 'rotina-filho',
        title: 'Rotina do Filho',
        description: 'Organização do dia da criança com cuidado.',
        href: '/meu-dia?focus=rotina-do-filho',
        icon: 'heart',
      },
      {
        id: 'prioridades-semana',
        title: 'Prioridades da Semana',
        description: 'O que realmente importa nesta semana.',
        href: '/meu-dia?focus=prioridades-da-semana',
        icon: 'star',
      },
    ],
  },
  {
    label: 'FERRAMENTAS DA MÃE',
    subtitle: 'Pequenas ações que fazem grande diferença.',
    cards: [
      {
        id: 'checklist-mae',
        title: 'Checklist da Mãe',
        description: 'Ações que fortalecem seu dia e sua família.',
        href: '/meu-dia?focus=checklist-da-mae',
        icon: 'check',
      },
      {
        id: 'notas-listas',
        title: 'Notas & Listas',
        description: 'Anotações rápidas e listas essenciais.',
        href: '/meu-dia?focus=notas-e-listas',
        icon: 'bookmark',
      },
    ],
  },
]

export default function RotinaLevePage() {
  let cardIndex = 0

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <ClientOnly>
        <div className="space-y-8 md:space-y-10">
          {/* Inspire Section */}
          <Reveal delay={0}>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56] tracking-tight">
                  INSPIRE O SEU DIA
                </h2>
                <p className="text-sm md:text-base text-[#545454]/75 mt-1">
                  Comece trazendo leveza antes de organizar tudo.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {INSPIRATION_CARDS.map((card) => {
                  const currentIndex = cardIndex
                  cardIndex += 1
                  return (
                    <Reveal key={card.id} delay={currentIndex * 25}>
                      <div className="flex flex-col h-full rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm p-5 md:p-6 transition-all duration-200 hover:bg-white/70">
                        <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                          {card.title}
                        </h3>
                        <p className="text-sm text-[#545454]/85 flex-1 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </Reveal>
                  )
                })}
              </div>
            </div>
          </Reveal>

          {/* Main Card Groups */}
          {CARD_GROUPS.map((group, groupIdx) => (
            <Reveal key={group.label} delay={(groupIdx + 1) * 50}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56] tracking-tight">
                    {group.label}
                  </h2>
                  {group.subtitle && (
                    <p className="text-sm md:text-base text-[#545454]/75 mt-1">
                      {group.subtitle}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {group.cards.map((card) => {
                    const currentIndex = cardIndex
                    cardIndex += 1
                    return (
                      <Reveal key={card.id} delay={currentIndex * 25}>
                        <Link href={card.href || '#'}>
                          <div className="flex flex-col h-full rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm p-5 md:p-6 hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(47,58,86,0.12)] active:scale-95 transition-all duration-200 cursor-pointer">
                            <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                              {card.title}
                            </h3>
                            <p className="text-sm text-[#545454]/85 mb-4 flex-1 leading-relaxed">
                              {card.description}
                            </p>
                            <div className="flex justify-end">
                              <span className="text-xs font-semibold text-primary/85 tracking-wide inline-flex items-center gap-1">
                                Ver mais →
                              </span>
                            </div>
                          </div>
                        </Link>
                      </Reveal>
                    )
                  })}
                </div>
              </div>
            </Reveal>
          ))}

          {/* Closing message */}
          <div className="mt-8 pt-4 border-t border-white/40">
            <p className="text-center text-sm text-[#545454]/70 leading-relaxed">
              Organize seu dia com leveza. Pequenos passos fazem a grande diferença. 💚
            </p>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
