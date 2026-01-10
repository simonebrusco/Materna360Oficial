'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SoftCard } from '@/components/ui/card'
import { FilterPill } from '@/components/ui/FilterPill'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

/* =========================================================
   P34.10 — Legibilidade & Ritmo de Leitura (Mobile)
   - quebra editorial (não muda copy)
   - desktop preservado
   - mobile respira em até 3 blocos
========================================================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []

  let text = String(raw).trim()
  if (!text) return []

  // 1) quebra editorial por travessão (—)
  // mantém o sentido e o símbolo
  text = text.replace(/\s+—\s+/g, ' —\n\n')

  // 2) quebra por frases (pontuação)
  const parts = text
    .split(/\n\n|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return parts.slice(0, 3)
}

function RenderEditorialText({
  text,
  className,
}: {
  text: string | null | undefined
  className: string
}) {
  const raw = (text ?? '').trim()
  const parts = splitEditorialText(raw)

  if (!raw) return null

  return (
    <>
      {/* Desktop: texto intacto */}
      <p className={`hidden md:block ${className}`}>{raw}</p>

      {/* Mobile: texto respirado */}
      <div className="md:hidden space-y-2">
        {parts.map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
      </div>
    </>
  )
}

/* ========================================================= */

interface MaterialCard {
  id: string
  title: string
  description: string
  theme: string
  format: string
  icon: string
  href: string
  external?: boolean
}

const THEMES = [
  'Sono',
  'Alimentação',
  'Emoções & Autorregulação',
  'Birras & Comportamento',
  'Rotinas',
  'Desenvolvimento Motor',
  'Linguagem & Comunicação',
  'Desenvolvimento Cognitivo',
  'Socialização & Vínculo',
  'Parentalidade Sem Culpa',
]

const FORMATS = ['PDF', 'eBook', 'Guia Prático', 'Checklist', 'Trilha educativa']

const MATERIALS: MaterialCard[] = [
  {
    id: 'checklist-rotina-manha',
    title: 'Checklist da Rotina da Manhã',
    description: 'Um passo a passo simples para começar o dia com um pouco mais de calma.',
    theme: 'Rotinas',
    format: 'Checklist',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'guia-leve-birras',
    title: 'Guia Leve Sobre Birras',
    description: 'Ideias práticas para lidar com explosões emocionais sem culpa.',
    theme: 'Birras & Comportamento',
    format: 'Guia Prático',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'pdf-sono-noturno',
    title: 'PDF – Sono em Noites Difíceis',
    description: 'Sugestões de pequenos ajustes para noites um pouco mais tranquilas.',
    theme: 'Sono',
    format: 'PDF',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'caderno-emocoes-familia',
    title: 'Caderno de Emoções da Família',
    description: 'Um material para ajudar todos a nomearem o que sentem com mais gentileza.',
    theme: 'Emoções & Autorregulação',
    format: 'eBook',
    icon: 'book-open',
    href: '#',
  },
]

type PresetFilter = 'guias' | 'pdfs-ebooks' | 'trilhas' | 'tema-fase' | null
type ViewStep = 'sugestao' | 'filtrar' | 'materiais' | 'insight'

export default function BibliotecaMaternaPage() {
  const searchParams = useSearchParams()
  const materialsRef = useRef<HTMLDivElement | null>(null)

  const [view, setView] = useState<ViewStep>('sugestao')
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('guias')

  const suggestionTitle = 'Sugestão pronta para agora: Guias e checklists'
  const suggestionSubtitle =
    'Para quando você quer clareza e um passo a passo rápido.'

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4">
          {/* HEADER */}
          <header className="pt-8 mb-6 space-y-3">
            <Link
              href="/maternar"
              className="inline-flex items-center text-[12px] text-white/85"
            >
              ← Voltar para o Maternar
            </Link>

            <h1 className="text-2xl font-semibold text-white">
              Biblioteca Materna
            </h1>

            <RenderEditorialText
              text="Você entra sem saber o que procurar e sai com um material certo para o seu momento — sem ficar caçando."
              className="text-sm text-white/90 leading-relaxed max-w-2xl"
            />
          </header>

          {/* CARD SUGESTÃO */}
          <SoftCard className="rounded-3xl bg-white/10 border border-white/35 backdrop-blur-xl p-4">
            <div className="space-y-2">
              <div className="text-[18px] font-semibold text-white">
                {suggestionTitle}
              </div>

              <RenderEditorialText
                text={suggestionSubtitle}
                className="text-[13px] text-white/85 leading-relaxed"
              />
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="biblioteca-materna" />
        </div>
      </ClientOnly>
    </main>
  )
}

