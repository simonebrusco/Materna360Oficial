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
      label="MATERNAR"
      title="Biblioteca materna"
      subtitle="Guias, trilhas e materiais que apoiam sua jornada, no seu tempo."
    >
      <ClientOnly>
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-2 md:px-6 space-y-10">
          {/* INTRO */}
          <Reveal delay={0}>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              Encontre materiais selecionados — PDFs, eBooks, guias práticos e
              conteúdos personalizados — filtrados por tema e formato para
              facilitar sua jornada.
            </p>
          </Reveal>

          {/* BLOCO FILTROS - CARD TRANSLÚCIDO */}
          <Reveal delay={40}>
            <SoftCard className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-5 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:px-8 md:py-8">
              {/* glow de fundo */}
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                    Filtrar por
                  </h2>
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)] md:text-sm">
                    Selecione um tema e um formato para encontrar conteúdos que
                    façam sentido para o seu momento.
                  </p>
                </div>

                {/* Tema */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-main)]">
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

                {/* Formato */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-main)]">
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

          {/* LISTA DE MATERIAIS */}
          <Reveal delay={70}>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                  Materiais disponíveis
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] md:text-sm">
                  {selectedTheme || selectedFormat
                    ? `Resultados filtrados por ${selectedTheme ? `tema: ${selectedTheme}` : ''}${selectedTheme && selectedFormat ? ' e ' : ''}${selectedFormat ? `formato: ${selectedFormat}` : ''}.`
                    : 'Todos os materiais'}
                </p>
              </div>

              <div className="h-px w-full bg-white/60" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {PLACEHOLDER_MATERIALS.map((material, index) => (
                  <Reveal key={material.id} delay={90 + index * 40}>
                    <SoftCard className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                      {/* Thumb */}
                      <div className="mb-4 flex h-28 items-center justify-center rounded-2xl bg-[var(--color-soft-strong)]/70">
                        <AppIcon
                          name={material.icon as any}
                          size={40}
                          className="text-[var(--color-brand)]/60"
                          decorative
                        />
                      </div>

                      {/* Conteúdo */}
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-[var(--color-text-main)]">
                        {material.title}
                      </h3>
                      <p className="mb-4 line-clamp-3 text-sm text-[var(--color-text-muted)]">
                        {material.description}
                      </p>

                      {/* Tags */}
                      <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-[var(--color-brand)]/10 px-2.5 py-1 font-medium text-[var(--color-brand)]">
                          {material.theme}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 font-medium text-[var(--color-text-muted)]">
                          {material.format}
                        </span>
                      </div>

                      {/* CTA */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => (window.location.href = '#')}
                        className="mt-auto w-full"
                      >
                        Acessar
                      </Button>
                    </SoftCard>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* INSIGHT PERSONALIZADO - CARD TRANSLÚCIDO */}
          <Reveal delay={110}>
            <SoftCard className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -left-12 -top-8 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.25)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-3">
                <h2 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                  Insight personalizado
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] md:text-sm">
                  Em breve, você verá aqui recomendações inteligentes com base
                  na idade e fase do seu filho.
                </p>

                <div className="mt-4 flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/70">
                    <AppIcon
                      name="idea"
                      size={22}
                      className="text-[var(--color-brand)]"
                      decorative
                    />
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-text-main)]">
                    Seu filho está passando por uma fase importante de
                    desenvolvimento. Quando a Biblioteca estiver ativa, você vai
                    receber aqui sugestões feitas para esse momento.
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* CTA PREMIUM - CARD TRANSLÚCIDO */}
          <Reveal delay={130}>
            <SoftCard className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 opacity-90">
                <div className="absolute -right-20 top-0 h-28 w-28 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                <div className="absolute -bottom-16 left-0 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.3)] blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                    <AppIcon name="sparkles" size={14} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)] md:text-xl">
                    Desbloqueie conteúdos completos
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    PDFs avançados, eBooks exclusivos, trilhas educativas e
                    guias profissionais em um só lugar.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex-shrink-0 whitespace-nowrap sm:w-auto"
                >
                  <AppIcon
                    name="crown"
                    size={16}
                    decorative
                    className="mr-1"
                  />
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
