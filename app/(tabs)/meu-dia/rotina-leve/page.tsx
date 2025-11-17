'use client'

import { useState, useEffect } from 'react'
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
  description: string
  href: string
}

const CARDS: Card[] = [
  {
    id: 'planejar-dia',
    icon: 'calendar',
    title: 'Planejar o Dia',
    description: 'Comece organizando o essencial.',
    href: '/meu-dia/rotina-leve/planejar-o-dia',
  },
  {
    id: 'rotina-casa',
    icon: 'home',
    title: 'Rotina da Casa',
    description: 'Tarefas do lar com praticidade.',
    href: '/meu-dia/rotina-leve/rotina-da-casa',
  },
  {
    id: 'rotina-filho',
    icon: 'heart',
    title: 'Rotina do Filho',
    description: 'Organização do dia da criança.',
    href: '/meu-dia/rotina-leve/rotina-do-filho',
  },
  {
    id: 'prioridades-semana',
    icon: 'star',
    title: 'Prioridades da Semana',
    description: 'O que realmente importa nesta semana.',
    href: '/meu-dia/rotina-leve/prioridades-da-semana',
  },
  {
    id: 'checklist-mae',
    icon: 'check-circle',
    title: 'Checklist da Mãe',
    description: 'Pequenas ações que fazem diferença.',
    href: '/meu-dia/rotina-leve/checklist-da-mae',
  },
  {
    id: 'notas-listas',
    icon: 'edit',
    title: 'Notas & Listas',
    description: 'Anotações rápidas e listas essenciais.',
    href: '/meu-dia/rotina-leve/notas-e-listas',
  },
  {
    id: 'receitas-saudaveis',
    icon: 'leaf',
    title: 'Receitas Saudáveis',
    description: 'Ideias rápidas com o que você tem em casa.',
    href: '/cuidar/receitas-saudaveis',
  },
]

function CardLink({ card, index }: { card: Card; index: number }) {
  return (
    <Reveal key={card.id} delay={index * 50}>
      <Link href={card.href}>
        <SoftCard className="flex h-full flex-col justify-between rounded-3xl border border-black/5 bg-white/90 p-6 md:p-8 shadow-[0_6px_22px_rgba(0,0,0,0.06)] backdrop-blur cursor-pointer transition-all duration-200 hover:shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AppIcon
                name={card.icon as any}
                size={24}
                className="text-primary"
                decorative
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-1">
                {card.title}
              </h3>
              <p className="text-sm text-[#545454] mb-4">
                {card.description}
              </p>
              <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                Acessar →
              </span>
            </div>
          </div>
        </SoftCard>
      </Link>
    </Reveal>
  )
}

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
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <ClientOnly>
        <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* Premium 2-Column Grid — Materna360 Standard Mini-Hub Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CARDS.map((card, idx) => (
              <CardLink key={card.id} card={card} index={idx} />
            ))}
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
