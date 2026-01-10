'use client'

import { useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { FilterPill } from '@/components/ui/FilterPill'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

interface MaterialCard {
  id: string
  title: string
  description: string
  theme: string
  format: string
  icon: string
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

const FORMATS = ['PDF', 'eBook', 'Guia Prático', 'Checklist', 'Insights (IA)']

const PLACEHOLDER_MATERIALS: MaterialCard[] = [
  {
    id: 'material-1',
    title: 'Título do Material',
    description: 'Descrição breve do conteúdo selecionado.',
    theme: 'Sono',
    format: 'PDF',
    icon: 'book-open',
  },
  {
    id: 'material-2',
    title: 'Título do Material',
    description: 'Descrição breve do conteúdo selecionado.',
    theme: 'Alimentação',
    format: 'eBook',
    icon: 'book-open',
  },
  {
    id: 'material-3',
    title: 'Título do Material',
    description: 'Descrição breve do conteúdo selecionado.',
    theme: 'Desenvolvimento Motor',
    format: 'Guia Prático',
    icon: 'book-open',
  },
]

/* =========================
   P34.10 — Legibilidade Mobile
   Quebra editorial (somente no mobile)
   - mantém o conteúdo/copy
   - melhora ritmo no mobile
   - desktop preservado (texto em 1 bloco)
   - no máximo 3 partes
========================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []

  const text = String(raw).trim()
  if (!text) return []

  // marcadores típicos para “respirar” sem mudar sentido
  // (sem "E" para evitar quebras artificiais)
  const markers = ['No final,', 'No fim,', 'Depois,', 'Em seguida,', 'Por fim,', 'Mas']

  let working = text

  // quebra antes de marcadores (best effort)
  markers.forEach((m) => {
    working = working.replace(new RegExp(`\\s+${m}\\s+`, 'g'), `\n\n${m} `)
  })

  // quebra por frases, mas com limite de 3 partes
  const parts = working
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

  // Desktop preservado: 1 bloco (sem quebra editorial)
  // Mobile: parágrafos curtos (2–3 no máximo)
  return (
    <>
      <p className={`hidden md:block ${className}`}>{raw}</p>

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

export default function BibliotecaMaternaPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(selectedTheme === theme ? null : theme)
  }

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(selectedFormat === format ? null : format)
  }

  const resultsLabel =
    selectedTheme || selectedFormat
      ? `Resultados filtrados por ${selectedTheme ? `tema: ${selectedTheme}` : ''} ${
          selectedTheme && selectedFormat ? 'e' : ''
        } ${selectedFormat ? `formato: ${selectedFormat}` : ''}`
      : 'Todos os materiais'

  return (
    <PageTemplate
      label="BIBLIOTECA"
      title="Biblioteca Materna"
      subtitle="Conteúdos que apoiam sua jornada."
    >
      <ClientOnly>
        {/* Alinhado com MaternaBox: largura padrão do conteúdo */}
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6 space-y-10">
          {/* INTRO TEXT */}
          <Reveal delay={0}>
            <div className="max-w-2xl">
              <RenderEditorialText
                text="Encontre materiais selecionados — PDFs, eBooks, guias práticos e conteúdos personalizados — filtrados por tema e formato para facilitar sua jornada."
                className="text-sm md:text-base text-neutral-600 leading-relaxed"
              />
            </div>
          </Reveal>

          {/* FILTER SECTION */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4 mb-8">
                <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Filtrar por
                </h2>

                <RenderEditorialText
                  text="Selecione um tema e formato para encontrar conteúdos relevantes."
                  className="text-xs md:text-sm text-[#545454] leading-relaxed"
                />
              </div>

              <div className="space-y-8">
                {/* Theme Filter */}
                <div>
                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                    Tema
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((theme) => (
                      <FilterPill
                        key={theme}
                        active={selectedTheme === theme}
                        onClick={() => handleThemeSelect(theme)}
                      >
                        {theme}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                {/* Format Filter */}
                <div>
                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                    Formato
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map((format) => (
                      <FilterPill
                        key={format}
                        active={selectedFormat === format}
                        onClick={() => handleFormatSelect(format)}
                      >
                        {format}
                      </FilterPill>
                    ))}
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* RESULTS SECTION */}
          <Reveal delay={80}>
            <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4 mb-8">
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Materiais Disponíveis
              </h2>

              {/* Aqui tende a ser curto, mas mantemos leitura suave no mobile */}
              <RenderEditorialText
                text={resultsLabel}
                className="text-xs md:text-sm text-[#545454] leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {PLACEHOLDER_MATERIALS.map((material, index) => (
                <Reveal key={material.id} delay={100 + index * 30}>
                  <SoftCard className="rounded-3xl p-5 sm:p-6 flex flex-col h-full bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(255,0,94,0.1)] overflow-hidden">
                    {/* Thumbnail Placeholder */}
                    <div className="mb-4 h-32 bg-gradient-to-br from-[var(--color-soft-strong)]/40 to-[var(--color-soft-strong)] rounded-2xl flex items-center justify-center">
                      <AppIcon
                        name={material.icon as any}
                        size={48}
                        className="text-[var(--color-brand)]/40"
                        decorative
                      />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2 line-clamp-2">
                      {material.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">
                      {material.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                        {material.theme}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]">
                        {material.format}
                      </span>
                    </div>

                    {/* CTA */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => (window.location.href = '#')}
                      className="w-full mt-auto"
                    >
                      Acessar
                    </Button>
                  </SoftCard>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* INSIGHT SECTION */}
          <Reveal delay={120}>
            <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4 mb-8">
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Insight Personalizado
              </h2>

              <RenderEditorialText
                text="Aqui você verá recomendações inteligentes baseadas na idade e fase do seu filho."
                className="text-xs md:text-sm text-[#545454] leading-relaxed"
              />
            </div>

            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#ffd8e6]/40 flex items-center justify-center">
                  <AppIcon
                    name="idea"
                    size={24}
                    className="text-[#ff005e]"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <RenderEditorialText
                    text="Seu filho está passando por uma fase importante de desenvolvimento. Em breve, sugestões personalizadas aparecerão aqui."
                    className="text-sm md:text-base text-[#545454] leading-relaxed"
                  />
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* PREMIUM CTA SECTION */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd8e6]/50 text-[#ff005e] text-xs font-semibold mb-3">
                    <AppIcon name="sparkles" size={12} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                    Desbloqueie conteúdos completos
                  </h3>

                  <RenderEditorialText
                    text="PDFs avançados, eBooks exclusivos e guias profissionais."
                    className="text-sm text-[#545454] leading-relaxed"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-shrink-0 whitespace-nowrap w-full sm:w-auto"
                >
                  <AppIcon name="crown" size={14} decorative className="mr-1" />
                  Conhecer Materna+
                </Button>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="biblioteca-materna" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
