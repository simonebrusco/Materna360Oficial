'use client'

import { useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { FilterPill } from '@/components/ui/FilterPill'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { useProfile } from '@/app/hooks/useProfile'

interface PlayIdea {
  id: string
  title: string
  description: string
  materials: string[]
  steps: string[]
  duration: string
  benefits: string[]
}

interface RecipeResult {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  ageNote: string
}

interface Product {
  id: string
  name: string
  benefit: string
  ageRange: string
}

const TIME_OPTIONS = ['5 min', '10 min', '15 min', '20 min', '30+ min']
const LOCATION_OPTIONS = ['Em casa', 'Ao ar livre']
const MOOD_OPTIONS = ['Calma', 'Foco', 'Leve', 'Energia']
const LEARNING_OPTIONS = [
  'Motricidade fina',
  'Motricidade grossa',
  'Sensorial',
  'Linguagem',
  'Criatividade',
  'Conexão',
]

const SAMPLE_TOYS: Product[] = [
  {
    id: 'toy-1',
    name: 'Blocos de Construção',
    benefit: 'Estimula criatividade e motricidade grossa',
    ageRange: '2+ anos',
  },
  {
    id: 'toy-2',
    name: 'Livros Interativos',
    benefit: 'Desenvolve linguagem e imaginação',
    ageRange: '1+ anos',
  },
  {
    id: 'toy-3',
    name: 'Instrumentos Musicais',
    benefit: 'Explora sons e desenvolve ritmo',
    ageRange: '1+ anos',
  },
  {
    id: 'toy-4',
    name: 'Brinquedos Sensoriais',
    benefit: 'Estimula exploração sensorial e tato',
    ageRange: '0+ meses',
  },
]

export default function AprenderBrincandoPage() {
  const [selectedTime, setSelectedTime] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState<string[]>([])
  const [selectedLearning, setSelectedLearning] = useState<string[]>([])
  const [showPlayResults, setShowPlayResults] = useState(false)

  const toggleFilter = (option: string, state: string[], setState: (s: string[]) => void) => {
    if (state.includes(option)) {
      setState(state.filter((s) => s !== option))
    } else {
      setState([...state, option])
    }
  }

  const handleGenerateIdeas = () => {
    setShowPlayResults(true)
  }

  return (
    <PageTemplate
      label="DESCOBRIR"
      title="Aprender Brincando"
      subtitle="Ideias rápidas, personalizadas e inteligentes para o dia a dia."
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
        {/* SECTION 2: SMART FILTERS */}
        <Reveal delay={80}>
          <SoftCard className="rounded-3xl p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56] mb-2">
                Filtros Inteligentes
              </h2>
              <p className="text-sm text-[#545454]">
                Personalize as brincadeiras de acordo com suas necessidades.
              </p>
            </div>

            <div className="space-y-6">
              {/* Time Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2f3a56] mb-3">
                  Tempo disponível
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((time) => (
                    <FilterPill
                      key={time}
                      active={selectedTime.includes(time)}
                      onClick={() => toggleFilter(time, selectedTime, setSelectedTime)}
                    >
                      {time}
                    </FilterPill>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2f3a56] mb-3">
                  Local
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map((loc) => (
                    <FilterPill
                      key={loc}
                      active={selectedLocation.includes(loc)}
                      onClick={() =>
                        toggleFilter(loc, selectedLocation, setSelectedLocation)
                      }
                    >
                      {loc}
                    </FilterPill>
                  ))}
                </div>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2f3a56] mb-3">
                  Tipo de atividade
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <FilterPill
                      key={mood}
                      active={selectedMood.includes(mood)}
                      onClick={() => toggleFilter(mood, selectedMood, setSelectedMood)}
                    >
                      {mood}
                    </FilterPill>
                  ))}
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-semibold text-[#2f3a56] mb-3">
                  Objetivo de aprendizado
                </label>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_OPTIONS.map((obj) => (
                    <FilterPill
                      key={obj}
                      active={selectedLearning.includes(obj)}
                      onClick={() =>
                        toggleFilter(obj, selectedLearning, setSelectedLearning)
                      }
                    >
                      {obj}
                    </FilterPill>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center sm:justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerateIdeas}
                className="rounded-full px-8 py-3"
              >
                <AppIcon name="sparkles" size={18} decorative className="mr-2" />
                Gerar Ideias
              </Button>
            </div>
          </SoftCard>
        </Reveal>

        {/* SECTION 3: AI RESULTS BLOCK */}
        {showPlayResults && (
          <Reveal delay={120}>
            <div className="space-y-4 mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56]">
                Resultados Personalizados
              </h2>
              <p className="text-sm text-[#545454]">
                Ideias baseadas nos seus filtros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Play Idea Card 1 */}
              <SoftCard className="rounded-3xl p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f3a56] mb-1">
                        Corrida do Travesseiro
                      </h3>
                      <p className="text-sm text-[#545454]">
                        Uma brincadeira cheia de movimento e risadas.
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-primary bg-[#FFE5EF] px-3 py-1 rounded-full whitespace-nowrap">
                      15 min
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                        Materiais necessários:
                      </p>
                      <p className="text-sm text-[#545454]">Travesseiros, almofadas</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                        Passos:
                      </p>
                      <ol className="text-sm text-[#545454] list-decimal list-inside space-y-1">
                        <li>Organize um espaço seguro</li>
                        <li>Faça uma linha de largada</li>
                        <li>Ao sinal, todos correm com travesseiros até a meta</li>
                      </ol>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                        Benefício do desenvolvimento:
                      </p>
                      <p className="text-sm text-[#545454]">
                        Motricidade grossa, coordenação
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full rounded-full mt-4"
                  >
                    Salvar no Planner
                  </Button>
                </div>
              </SoftCard>

              {/* Play Idea Card 2 */}
              <SoftCard className="rounded-3xl p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f3a56] mb-1">
                        Caça ao Tesouro Sensorial
                      </h3>
                      <p className="text-sm text-[#545454]">
                        Explore texturas e descobertas táteis.
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-primary bg-[#FFE5EF] px-3 py-1 rounded-full whitespace-nowrap">
                      10 min
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                        Materiais necessários:
                      </p>
                      <p className="text-sm text-[#545454]">
                        Objetos com diferentes texturas (lã, papel, plástico)
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                        Passos:
                      </p>
                      <ol className="text-sm text-[#545454] list-decimal list-inside space-y-1">
                        <li>Reúna objetos com texturas variadas</li>
                        <li>Esconda-os pela casa ou quintal</li>
                        <li>Seu filho encontra e explora cada um</li>
                      </ol>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                        Benefício do desenvolvimento:
                      </p>
                      <p className="text-sm text-[#545454]">
                        Exploração sensorial, descoberta
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full rounded-full mt-4"
                  >
                    Salvar no Planner
                  </Button>
                </div>
              </SoftCard>
            </div>
          </Reveal>
        )}


        {/* SECTION 5: RECOMMENDED TOYS & PRODUCTS */}
        <Reveal delay={200}>
          <div className="space-y-4 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56]">
              Brinquedos Recomendados
            </h2>
            <p className="text-sm text-[#545454]">
              Produtos que combinam com a idade do seu filho e estimulam seu desenvolvimento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {SAMPLE_TOYS.map((toy) => (
              <SoftCard key={toy.id} className="rounded-3xl p-5 md:p-6 flex flex-col h-full">
                <div className="h-32 sm:h-40 w-full rounded-2xl bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] mb-4 flex items-center justify-center">
                  <AppIcon
                    name="gift"
                    size={32}
                    className="text-primary opacity-40"
                    decorative
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="text-base font-semibold text-[#2f3a56] mb-1">
                    {toy.name}
                  </h3>
                  <p className="text-sm text-[#545454] mb-3">{toy.benefit}</p>
                  <p className="text-xs text-primary font-semibold">
                    Idade: {toy.ageRange}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full rounded-full mt-4"
                >
                  Ver produto
                </Button>
              </SoftCard>
            ))}
          </div>
        </Reveal>

      </div>
    </PageTemplate>
  )
}
