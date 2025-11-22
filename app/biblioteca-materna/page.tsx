'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { FilterPill } from '@/components/ui/FilterPill'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'

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

const FORMATS = [
  'PDF',
  'eBook',
  'Guia Prático',
  'Checklist',
  'Insights (IA)',
]

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

export default function BibliotecaMaternaPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(selectedTheme === theme ? null : theme)
  }

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(selectedFormat === format ? null : format)
  }

  return (
    <PageTemplate
      label="BIBLIOTECA"
      title="Biblioteca Materna"
      subtitle="Conteúdos que apoiam sua jornada."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-10">
          {/* INTRO TEXT */}
          <Reveal delay={0}>
            <div className="max-w-2xl">
              <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                Encontre materiais selecionados — PDFs, eBooks, guias práticos e conteúdos personalizados — filtrados por tema e formato para facilitar sua jornada.
              </p>
            </div>
          </Reveal>

          {/* FILTER SECTION */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4 mb-8">
                <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Filtrar por
                </h2>
                <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                  Selecione um tema e formato para encontrar conteúdos relevantes.
                </p>
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
            <div className="space-y-4 mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                Materiais Disponíveis
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {selectedTheme || selectedFormat
                  ? `Resultados filtrados por ${selectedTheme ? `tema: ${selectedTheme}` : ''} ${selectedTheme && selectedFormat ? 'e' : ''} ${selectedFormat ? `formato: ${selectedFormat}` : ''}`
                  : 'Todos os materiais'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {PLACEHOLDER_MATERIALS.map((material, index) => (
                <Reveal key={material.id} delay={100 + index * 30}>
                  <Link href="#" className="block h-full">
                    <SoftCard className="rounded-3xl p-5 sm:p-6 flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden">
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
                      <div className="flex justify-end mt-auto">
                        <span className="text-sm font-medium text-[var(--color-brand)] inline-flex items-center gap-1">
                          Acessar →
                        </span>
                      </div>
                    </SoftCard>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* INSIGHT SECTION */}
          <Reveal delay={120}>
            <div className="space-y-4 mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                Insight Personalizado
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Aqui você verá recomendações inteligentes baseadas na idade e fase do seu filho.
              </p>
            </div>

            <SoftCard className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[var(--color-soft-strong)]/40 to-white border border-[var(--color-brand)]/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center">
                  <AppIcon
                    name="idea"
                    size={24}
                    className="text-[var(--color-brand)]"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                    Seu filho está passando por uma fase importante de desenvolvimento. Em breve, sugestões personalizadas aparecerão aqui.
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* PREMIUM CTA SECTION */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[var(--color-brand)]/8 to-white border border-[var(--color-brand)]/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand)]/20 text-[var(--color-brand)] text-xs font-semibold mb-3">
                    <AppIcon name="sparkles" size={12} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-2">
                    Desbloqueie conteúdos completos
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    PDFs avançados, eBooks exclusivos e guias profissionais.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-shrink-0 whitespace-nowrap rounded-full px-8"
                >
                  <AppIcon name="crown" size={16} decorative className="mr-2" />
                  Conhecer Materna+
                </Button>
              </div>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
