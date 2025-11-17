'use client'

import { useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { FilterPill } from '@/components/ui/FilterPill'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'

interface FilterGroup {
  id: string
  label: string
  options: string[]
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'tempo',
    label: 'Tempo disponível',
    options: ['5 min', '10 min', '15 min', '20+ min'],
  },
  {
    id: 'objetivo',
    label: 'Objetivo da brincadeira',
    options: [
      'Foco',
      'Energia',
      'Criatividade',
      'Calma',
      'Movimento',
      'Exploração sensorial',
      'Linguagem',
      'Imaginação',
    ],
  },
  {
    id: 'espaco',
    label: 'Espaço disponível',
    options: ['Em casa', 'Ao ar livre', 'Pouca bagunça', 'Materiais simples'],
  },
]

const RESULT_PLACEHOLDERS = [
  {
    id: 'resultado-1',
    title: 'Sugestão personalizada 1',
    subtitle:
      'Quando a IA estiver ativada, você verá aqui uma brincadeira criada especialmente para o seu filho.',
  },
  {
    id: 'resultado-2',
    title: 'Sugestão personalizada 2',
    subtitle:
      'Quando a IA estiver ativada, você verá aqui uma brincadeira criada especialmente para o seu filho.',
  },
]

const RECOMMENDATIONS = [
  {
    id: 'produto-1',
    title: 'Produto recomendado 1',
    subtitle: 'Aqui aparecerá uma recomendação com link de afiliado.',
  },
  {
    id: 'produto-2',
    title: 'Produto recomendado 2',
    subtitle: 'Sugestão baseada na idade do seu filho.',
  },
  {
    id: 'produto-3',
    title: 'Produto recomendado 3',
    subtitle: 'Recomendação personalizada para desenvolvimento.',
  },
]

export default function AprenderBrincandoPage() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(
    {}
  )

  const toggleFilter = (groupId: string, option: string) => {
    setSelectedFilters((prev) => {
      const groupFilters = prev[groupId] || []
      const isSelected = groupFilters.includes(option)

      return {
        ...prev,
        [groupId]: isSelected
          ? groupFilters.filter((f) => f !== option)
          : [...groupFilters, option],
      }
    })
  }

  const isFilterActive = (groupId: string, option: string) => {
    return (selectedFilters[groupId] || []).includes(option)
  }

  return (
    <PageTemplate
      label="DESCOBRIR"
      title="Aprender Brincando"
      subtitle="Ideias inteligentes e personalizadas para o seu filho."
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
        {/* FILTERS SECTION */}
        <Reveal delay={100}>
          <SoftCard className="rounded-3xl p-5 sm:p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#2f3a56] mb-1">
                Filtros Inteligentes
              </h2>
              <p className="text-sm text-[#545454]">
                Personalize as ideias de brincadeiras para suas necessidades.
              </p>
            </div>

            <div className="space-y-6">
              {FILTER_GROUPS.map((group) => (
                <div key={group.id} className="space-y-3">
                  <label className="block text-sm font-semibold text-[#2f3a56]">
                    {group.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <FilterPill
                        key={`${group.id}-${option}`}
                        active={isFilterActive(group.id, option)}
                        onClick={() => toggleFilter(group.id, option)}
                      >
                        {option}
                      </FilterPill>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                className="px-8 py-3 rounded-full font-semibold"
              >
                Buscar ideias
              </Button>
            </div>
          </SoftCard>
        </Reveal>

        {/* RESULTS SECTION */}
        <Reveal delay={150}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-[#2f3a56]">
                Sugestões para Hoje
              </h2>
            </div>
            <p className="text-sm text-[#545454]">
              Aqui aparecerão suas ideias personalizadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {RESULT_PLACEHOLDERS.map((result) => (
              <SoftCard
                key={result.id}
                className="rounded-3xl p-5 sm:p-6 flex flex-col h-full"
              >
                {/* Icon placeholder */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] mb-4" />

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-base sm:text-lg font-semibold text-[#2f3a56] mb-2">
                    {result.title}
                  </h3>
                  <p className="text-sm text-[#545454] mb-6">
                    {result.subtitle}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full rounded-full"
                  >
                    Salvar no Planner
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-full"
                  >
                    Começar agora
                  </Button>
                </div>
              </SoftCard>
            ))}
          </div>
        </Reveal>

        {/* RECOMMENDATIONS SECTION */}
        <Reveal delay={200}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-[#2f3a56]">
                Recomendações Inteligentes
              </h2>
            </div>
            <p className="text-sm text-[#545454]">
              Brinquedos e materiais que combinam com a idade do seu filho.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {RECOMMENDATIONS.map((product) => (
              <SoftCard
                key={product.id}
                className="rounded-3xl p-5 sm:p-6 flex flex-col h-full"
              >
                {/* Product image placeholder */}
                <div className="h-32 sm:h-40 w-full rounded-2xl bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] mb-4 flex items-center justify-center">
                  <AppIcon
                    name="shopping-bag"
                    size={32}
                    className="text-primary opacity-40"
                    decorative
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-base sm:text-lg font-semibold text-[#2f3a56] mb-2">
                    {product.title}
                  </h3>
                  <p className="text-sm text-[#545454]">
                    {product.subtitle}
                  </p>
                </div>

                {/* CTA */}
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1 mt-4">
                  Ver detalhes <span>→</span>
                </span>
              </SoftCard>
            ))}
          </div>
        </Reveal>
      </div>
    </PageTemplate>
  )
}
