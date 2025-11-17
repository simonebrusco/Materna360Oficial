'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'

interface CardItem {
  id: string
  title: string
  description: string
  href: string
}

interface CardGroup {
  label: string
  cards: CardItem[]
}

const CARD_GROUPS: CardGroup[] = [
  {
    label: 'ORGANIZAÇÃO DO DIA',
    cards: [
      {
        id: 'planejar-dia',
        title: 'Planejar o Dia',
        description: 'Comece organizando o essencial.',
        href: '/meu-dia?focus=planejar-o-dia',
      },
      {
        id: 'rotina-casa',
        title: 'Rotina da Casa',
        description: 'Tarefas do lar com praticidade.',
        href: '/meu-dia?focus=rotina-da-casa',
      },
    ],
  },
  {
    label: 'ROTINA DA FAMÍLIA',
    cards: [
      {
        id: 'rotina-filho',
        title: 'Rotina do Filho',
        description: 'Organização do dia da criança.',
        href: '/meu-dia?focus=rotina-do-filho',
      },
      {
        id: 'prioridades-semana',
        title: 'Prioridades da Semana',
        description: 'O que realmente importa nesta semana.',
        href: '/meu-dia?focus=prioridades-da-semana',
      },
    ],
  },
  {
    label: 'FERRAMENTAS DA MÃE',
    cards: [
      {
        id: 'checklist-mae',
        title: 'Checklist da Mãe',
        description: 'Pequenas ações que fazem diferença.',
        href: '/meu-dia?focus=checklist-da-mae',
      },
      {
        id: 'notas-listas',
        title: 'Notas & Listas',
        description: 'Anotações rápidas e listas essenciais.',
        href: '/meu-dia?focus=notas-e-listas',
      },
    ],
  },
  {
    label: 'IDEIAS RÁPIDAS',
    cards: [
      {
        id: 'receitas-saudaveis',
        title: 'Receitas Saudáveis',
        description: 'Ideias rápidas com o que você tem em casa.',
        href: '/cuidar/receitas-saudaveis',
      },
    ],
  },
]

export default function RotinaLevePage() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return null
  }

  let cardIndex = 0

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {CARD_GROUPS.map((group, groupIdx) => (
            <Reveal key={group.label} delay={groupIdx * 50}>
              <SoftCard className="rounded-3xl p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                    {group.label}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.cards.map((card) => {
                    const currentIndex = cardIndex
                    cardIndex += 1
                    return (
                      <Reveal key={card.id} delay={currentIndex * 25}>
                        <Link href={card.href}>
                          <div className="flex flex-col h-full rounded-2xl border border-white/60 bg-white/60 p-4 hover:bg-white/80 transition-all duration-200 cursor-pointer">
                            <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                              {card.title}
                            </h4>
                            <p className="text-xs text-[#545454] mb-3 flex-1">
                              {card.description}
                            </p>
                            <div className="flex justify-end">
                              <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                                Ver mais →
                              </span>
                            </div>
                          </div>
                        </Link>
                      </Reveal>
                    )
                  })}
                </div>
              </SoftCard>
            </Reveal>
          ))}
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
