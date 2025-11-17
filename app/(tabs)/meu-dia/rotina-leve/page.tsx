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

const SECTION_1: Card[] = [
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
]

const SECTION_2: Card[] = [
  {
    id: 'rotina-filho',
    icon: 'heart',
    title: 'Rotina do Filho',
    description: 'A rotina diária da criança.',
    href: '/meu-dia/rotina-leve/rotina-do-filho',
  },
  {
    id: 'prioridades-semana',
    icon: 'star',
    title: 'Prioridades da Semana',
    description: 'O que realmente importa nesta semana.',
    href: '/meu-dia/rotina-leve/prioridades-da-semana',
  },
]

const SECTION_3: Card[] = [
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
    href: '/meu-dia/rotina-leve/receitas-saudaveis',
  },
]

function CardLink({ card, index }: { card: Card; index: number }) {
  return (
    <Reveal key={card.id} delay={index * 50}>
      <Link href={card.href}>
        <SoftCard className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-md h-full">
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

export default function RotatinaLevePage() {
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
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8 md:space-y-10">
          {/* SEÇÃO 1 — ORGANIZAÇÃO DO DIA */}
          <section>
            <h2 className="text-xs md:text-sm font-semibold uppercase text-[#999999] tracking-wider mb-4">
              Organização do Dia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTION_1.map((card, idx) => (
                <CardLink key={card.id} card={card} index={idx} />
              ))}
            </div>
          </section>

          {/* SEÇÃO 2 — ROTINA DA FAMÍLIA */}
          <section>
            <h2 className="text-xs md:text-sm font-semibold uppercase text-[#999999] tracking-wider mb-4">
              Rotina da Família
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTION_2.map((card, idx) => (
                <CardLink key={card.id} card={card} index={idx + SECTION_1.length} />
              ))}
            </div>
          </section>

          {/* SEÇÃO 3 — FERRAMENTAS DA MÃE */}
          <section>
            <h2 className="text-xs md:text-sm font-semibold uppercase text-[#999999] tracking-wider mb-4">
              Ferramentas da Mãe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:auto-rows-max">
              {SECTION_3.slice(0, 2).map((card, idx) => (
                <CardLink
                  key={card.id}
                  card={card}
                  index={idx + SECTION_1.length + SECTION_2.length}
                />
              ))}
              {/* Last card — centered alone on its own row */}
              <div className="md:col-span-2 md:flex md:justify-center">
                <div className="w-full md:w-1/2">
                  <CardLink
                    card={SECTION_3[2]}
                    index={SECTION_1.length + SECTION_2.length + 2}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
