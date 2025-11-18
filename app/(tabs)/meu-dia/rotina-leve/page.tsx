'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface CardItem {
  id: string
  icon: KnownIconName
  title: string
  description: string
  href: string
}

interface CardGroup {
  label: string
  cards: CardItem[]
}

const ESSENTIAL_CARDS: CardItem[] = [
  {
    id: 'planejar-dia',
    title: 'Planejar o Dia',
    description: 'Comece organizando o essencial.',
    href: '/meu-dia?focus=planejar-o-dia',
    icon: 'calendar',
  },
  {
    id: 'rotina-casa',
    title: 'Rotina da Casa',
    description: 'Tarefas do lar com praticidade.',
    href: '/meu-dia?focus=rotina-da-casa',
    icon: 'home',
  },
  {
    id: 'rotina-filho',
    title: 'Rotina do Filho',
    description: 'Organização do dia da criança.',
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
]

const TOOLS_CARDS: CardItem[] = [
  {
    id: 'checklist-mae',
    title: 'Checklist da Mãe',
    description: 'Pequenas ações que fazem diferença.',
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
]

const DISCOVER_CARDS: CardItem[] = [
  {
    id: 'autocuidado',
    title: 'Autocuidado Inteligente',
    description: 'Cuidando de você com intenção, leveza e verdade.',
    href: '/cuidar/autocuidado-inteligente',
    icon: 'heart',
  },
  {
    id: 'como-estou-hoje',
    title: 'Como Estou Hoje',
    description: 'Humor e energia com mais consciência.',
    href: '/meu-dia/como-estou-hoje',
    icon: 'smile',
  },
  {
    id: 'minhas-conquistas',
    title: 'Minhas Conquistas',
    description: 'Celebre seu progresso — um passo de cada vez.',
    href: '/meu-dia/minhas-conquistas',
    icon: 'star',
  },
  {
    id: 'biblioteca-materna',
    title: 'Biblioteca Materna',
    description: 'Conteúdos que apoiam sua jornada.',
    href: '/biblioteca-materna',
    icon: 'book-open',
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

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina leve, dia mais tranquilo"
      subtitle="Organize seu dia com carinho, sem cobrança e sem perfeccionismo. Aqui você cria uma rotina que respeita o seu ritmo e o da sua família."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-10">
          {/* SECTION 1 — Comece pelo essencial */}
          <Reveal delay={0}>
            <div>
              <div className="mb-8">
                <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Comece pelo essencial
                </h2>
                <p className="text-sm text-[#545454]">
                  Defina o que realmente importa hoje e alivie a sensação de estar sempre devendo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {ESSENTIAL_CARDS.map((card, index) => (
                  <Reveal key={card.id} delay={50 + index * 25}>
                    <Link href={card.href}>
                      <SoftCard className="rounded-3xl p-6 md:p-8 h-full flex flex-col cursor-pointer hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0">
                            <AppIcon
                              name={card.icon}
                              size={24}
                              className="text-primary"
                              decorative
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1">
                              {card.title}
                            </h3>
                            <p className="text-sm text-[#545454]">
                              {card.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-auto pt-4">
                          <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                            Acessar →
                          </span>
                        </div>
                      </SoftCard>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* SECTION 2 — Ferramentas da Mãe */}
          <Reveal delay={100}>
            <div>
              <div className="mb-8">
                <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Ferramentas da Mãe
                </h2>
                <p className="text-sm text-[#545454]">
                  Recursos extras para apoiar sua rotina.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {TOOLS_CARDS.map((card, index) => (
                  <Reveal key={card.id} delay={150 + index * 25}>
                    <Link href={card.href}>
                      <SoftCard className="rounded-3xl p-6 md:p-8 h-full flex flex-col cursor-pointer hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0">
                            <AppIcon
                              name={card.icon}
                              size={24}
                              className="text-primary"
                              decorative
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1">
                              {card.title}
                            </h3>
                            <p className="text-sm text-[#545454]">
                              {card.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-auto pt-4">
                          <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                            Acessar →
                          </span>
                        </div>
                      </SoftCard>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* SECTION 3 — Planner Materna360 CTA */}
          <Reveal delay={200}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#ffe3f0] via-white to-[#ffe9f5]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                    Planner Materna360
                  </h2>
                  <p className="text-sm text-[#545454] leading-relaxed">
                    Quando você organiza seu dia com calma, o Planner vira um aliado — não um fiscal. Explore a visão completa da sua semana e integre a Rotina Leve com seu planejamento.
                  </p>
                </div>
                <Link
                  href="/meu-dia"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Ir para o Planner
                  <span>→</span>
                </Link>
              </div>
            </SoftCard>
          </Reveal>

          {/* SECTION 4 — Cuidar de mim enquanto cuido de tudo */}
          <Reveal delay={250}>
            <div>
              <div className="mb-8">
                <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Cuidar de mim enquanto cuido de tudo
                </h2>
                <p className="text-sm text-[#545454]">
                  Use outras áreas do Materna360 para equilibrar emoção, rotina e autocuidado.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {DISCOVER_CARDS.map((card, index) => (
                  <Reveal key={card.id} delay={300 + index * 25}>
                    <Link href={card.href}>
                      <SoftCard className="rounded-3xl p-6 md:p-8 h-full flex flex-col cursor-pointer hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] flex items-center justify-center">
                            <AppIcon
                              name={card.icon}
                              size={20}
                              className="text-primary"
                              decorative
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1">
                              {card.title}
                            </h3>
                            <p className="text-sm text-[#545454]">
                              {card.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-auto pt-4">
                          <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                            Explorar →
                          </span>
                        </div>
                      </SoftCard>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
