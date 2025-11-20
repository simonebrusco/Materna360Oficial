'use client'

import { useState, useCallback, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { useProfile } from '@/app/hooks/useProfile'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import { toast } from '@/app/lib/toast'
import AppIcon from '@/components/ui/AppIcon'

type ExpandedCard = 'ideas' | 'recipes' | 'inspirations' | null
type PlanTier = 'free' | 'plus' | 'premium'

const PLAN_TIER: PlanTier = 'free'

interface Idea {
  id: string
  title: string
  description: string
}

interface Recipe {
  id: string
  name: string
  time: string
  suggestedAge: string
  description: string
}

interface Inspiration {
  id: string
  phrase: string
  action: string
}

interface UsageRecord {
  date: string
  recipesCount: number
}

const MOCK_IDEAS: Idea[] = [
  {
    id: 'idea-1',
    title: 'Brincadeira da chuva',
    description: 'Use uma peneira ou escorredor com água para criar uma "chuva" dentro de casa. Seguro e muito divertido!',
  },
  {
    id: 'idea-2',
    title: 'Organização por cores',
    description: 'Separe brinquedos, roupas ou itens por cores em caixas. Ensina organização de forma lúdica.',
  },
  {
    id: 'idea-3',
    title: 'Autocuidado em 5 min',
    description: 'Um exercício rápido de respiração profunda enquanto toma um chá. Foco e calma para o dia.',
  },
]

const MOCK_RECIPES: Recipe[] = [
  {
    id: 'recipe-1',
    name: 'Papinha de banana com aveia',
    time: '5 min',
    suggestedAge: 'A partir de 6 meses',
    description: 'Simples, nutritiva e perfeita para começar a alimentação complementar.',
  },
  {
    id: 'recipe-2',
    name: 'Bolo de cenoura saudável',
    time: '30 min',
    suggestedAge: 'A partir de 1 ano',
    description: 'Receita sem açúcar refinado, ideal para lanches em familia.',
  },
  {
    id: 'recipe-3',
    name: 'Sopa de legumes rápida',
    time: '20 min',
    suggestedAge: 'A partir de 8 meses',
    description: 'Caldo quentinho que nutre toda a família no mesmo lugar.',
  },
]

const MOCK_INSPIRATIONS: Inspiration[] = [
  {
    id: 'insp-1',
    phrase: 'Você é forte o suficiente para ser mãe e vulnerável o suficiente para pedir ajuda.',
    action: 'Hoje, permita-se descansar sem culpa por 15 minutos.',
  },
  {
    id: 'insp-2',
    phrase: 'A organização perfecta não existe. Existe a organização que funciona para VOCÊ.',
    action: 'Simplifique uma rotina hoje: escolha uma coisa que pode ser mais fácil.',
  },
  {
    id: 'insp-3',
    phrase: 'Cada momento com seu filho é único, mesmo que pareça rotina.',
    action: 'Faça contato visual e um abraço genuíno com seu filho nos próximos 5 minutos.',
  },
]

function getChildAge(childBirthDate?: string): number | null {
  if (!childBirthDate) return null
  const birthDate = new Date(childBirthDate)
  const today = new Date()
  const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
  return ageInMonths
}

function getUsageKey(): string {
  return 'm360:ai-usage:recipes'
}

function getTodayDate(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

function getRecipesLimit(tier: PlanTier): number {
  switch (tier) {
    case 'free':
      return 1
    case 'plus':
      return 2
    case 'premium':
      return 3
    default:
      return 1
  }
}

function canGenerateRecipe(tier: PlanTier): { allowed: boolean; used: number; limit: number } {
  const storageKey = getUsageKey()
  const today = getTodayDate()
  let usage: UsageRecord = { date: '', recipesCount: 0 }

  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    if (stored) {
      usage = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to parse usage record:', e)
  }

  const limit = getRecipesLimit(tier)
  const isToday = usage.date === today
  const used = isToday ? usage.recipesCount : 0
  const allowed = used < limit

  return { allowed, used, limit }
}

function recordRecipeGeneration(tier: PlanTier): void {
  const storageKey = getUsageKey()
  const today = getTodayDate()

  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    let usage: UsageRecord = { date: '', recipesCount: 0 }

    if (stored) {
      usage = JSON.parse(stored)
    }

    if (usage.date === today) {
      usage.recipesCount += 1
    } else {
      usage = { date: today, recipesCount: 1 }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(usage))
    }
  } catch (e) {
    console.error('Failed to record recipe generation:', e)
  }
}

function IdeasRapidas({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  const { addItem } = usePlannerSavedContents()
  const [selectedFilters, setSelectedFilters] = useState({
    time: '',
    withWhom: '',
    type: '',
  })
  const [showResults, setShowResults] = useState(false)

  const handleSaveIdea = (idea: Idea) => {
    addItem({
      origin: 'rotina-leve',
      type: 'insight',
      title: idea.title,
      payload: { description: idea.description },
    })
  }

  const handleGenerateIdeas = () => {
    if (!selectedFilters.time || !selectedFilters.withWhom || !selectedFilters.type) {
      toast.info('Escolha todos os filtros para gerar ideias')
      return
    }
    setShowResults(true)
  }

  return (
    <SoftCard
      className="flex flex-col h-full hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] active:scale-95 transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex-1">
        <h3 className="text-base font-semibold text-[#2f3a56] mb-3 font-poppins">
          Ideias Rápidas
        </h3>
        <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins">
          Inspirações simples para deixar o dia mais leve.
        </p>
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-[#ececec]/30 space-y-5">
          <p className="text-sm text-[#545454] font-poppins">
            Escolha alguns filtros e eu te trago ideias rápidas para o seu momento.
          </p>

          <div className="space-y-4">
            <div onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                Tempo disponível
              </p>
              <div className="flex flex-wrap gap-2">
                {['5 min', '10 min', '20 min', '30+'].map((time) => (
                  <button
                    key={time}
                    onClick={() =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        time: prev.time === time ? '' : time,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedFilters.time === time
                        ? 'bg-[#ffd8e6] text-[#ff005e]'
                        : 'bg-[#f5f5f5] text-[#545454] hover:bg-[#ececec]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                Com quem
              </p>
              <div className="flex flex-wrap gap-2">
                {['Só eu', 'Eu e meu filho', 'Família toda'].map((person) => (
                  <button
                    key={person}
                    onClick={() =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        withWhom: prev.withWhom === person ? '' : person,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedFilters.withWhom === person
                        ? 'bg-[#ffd8e6] text-[#ff005e]'
                        : 'bg-[#f5f5f5] text-[#545454] hover:bg-[#ececec]'
                    }`}
                  >
                    {person}
                  </button>
                ))}
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                Tipo de ideia
              </p>
              <div className="flex flex-wrap gap-2">
                {['Brincadeira', 'Organização', 'Autocuidado', 'Receita rápida'].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        type: prev.type === type ? '' : type,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedFilters.type === type
                        ? 'bg-[#ffd8e6] text-[#ff005e]'
                        : 'bg-[#f5f5f5] text-[#545454] hover:bg-[#ececec]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleGenerateIdeas()
              }}
              className="w-full mt-4 px-4 py-2.5 bg-[#ff005e] text-white rounded-lg font-semibold text-sm hover:bg-[#e6004d] transition-colors font-poppins"
            >
              Gerar ideias ✨
            </button>

            {showResults && (
              <div className="mt-4 space-y-3 border-t border-[#ececec]/30 pt-4">
                {MOCK_IDEAS.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-[#f9f9f9] rounded-lg p-3 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-semibold text-[#2f3a56] font-poppins">{idea.title}</p>
                    <p className="text-xs text-[#545454] leading-relaxed">{idea.description}</p>
                    <button
                      onClick={() => handleSaveIdea(idea)}
                      className="text-xs font-semibold text-[#ff005e] hover:text-[#e6004d] transition-colors"
                    >
                      Salvar no planner
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!expanded && (
        <div className="flex justify-end mt-6 pt-2 border-t border-[#ececec]/30">
          <span className="text-sm font-semibold text-primary tracking-wide font-poppins">
            Ver mais →
          </span>
        </div>
      )}
    </SoftCard>
  )
}

function ReceitasInteligentes() {
  const { children } = useProfile()
  const { addItem } = usePlannerSavedContents()

  const [mainIngredient, setMainIngredient] = useState('')
  const [mealType, setMealType] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [showResults, setShowResults] = useState(false)

  const childAge = useMemo(() => {
    if (!children || children.length === 0) return null
    const firstChild = children[0]
    return getChildAge(firstChild.birthDate)
  }, [children])

  const isAgeTooYoung = childAge !== null && childAge < 6

  const usage = useMemo(() => canGenerateRecipe(PLAN_TIER), [])

  const handleSaveRecipe = (recipe: Recipe) => {
    addItem({
      origin: 'rotina-leve',
      type: 'recipe',
      title: recipe.name,
      payload: {
        time: recipe.time,
        suggestedAge: recipe.suggestedAge,
        description: recipe.description,
      },
    })
  }

  const handleGenerateRecipes = () => {
    if (isAgeTooYoung) {
      return
    }

    if (!usage.allowed) {
      toast.info('Você chegou ao limite de receitas inteligentes do seu plano hoje. Amanhã tem mais 💗')
      return
    }

    if (!mainIngredient || !mealType || !prepTime) {
      toast.info('Preencha todos os campos para gerar receitas')
      return
    }

    recordRecipeGeneration(PLAN_TIER)
    setShowResults(true)
  }

  return (
    <SoftCard className="flex flex-col h-full hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] active:scale-95 transition-all duration-200">
      <h3 className="text-base font-semibold text-[#2f3a56] mb-3 font-poppins">
        Receitas Inteligentes
      </h3>
      <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins mb-6">
        Você diz o ingrediente, eu te ajudo com o resto.
      </p>

      <div className="space-y-5">
        {isAgeTooYoung ? (
          <div className="bg-[#fff0f6] border border-[#ffd8e6] rounded-lg p-4">
            <p className="text-sm text-[#ff005e] font-poppins leading-relaxed">
              Nesta fase, o ideal é manter o foco no aleitamento materno. Fale sempre com o pediatra antes de introduzir novos alimentos 💗
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide block mb-2">
                Ingrediente principal
              </label>
              <input
                type="text"
                placeholder="Ex.: banana, ovo, o que tiver na geladeira"
                value={mainIngredient}
                onChange={(e) => setMainIngredient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#ececec] text-sm focus:outline-none focus:border-[#ff005e] focus:ring-1 focus:ring-[#ff005e] font-poppins"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide block mb-2">
                Tipo de refeição
              </label>
              <div className="flex flex-wrap gap-2">
                {['Café da manhã', 'Lanche', 'Almoço/Jantar', 'Sobremesa leve'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(mealType === type ? '' : type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      mealType === type
                        ? 'bg-[#ffd8e6] text-[#ff005e]'
                        : 'bg-[#f5f5f5] text-[#545454] hover:bg-[#ececec]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide block mb-2">
                Tempo de preparo
              </label>
              <div className="flex flex-wrap gap-2">
                {['10 min', '20 min', '30 min', '40+'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setPrepTime(prepTime === time ? '' : time)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      prepTime === time
                        ? 'bg-[#ffd8e6] text-[#ff005e]'
                        : 'bg-[#f5f5f5] text-[#545454] hover:bg-[#ececec]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {children && children.length > 0 && (
              <div className="text-xs text-[#545454] bg-[#f5f5f5] rounded-lg p-2 font-poppins">
                <span className="font-semibold">Idade do seu filho:</span>{' '}
                {childAge !== null && childAge >= 0 ? `${childAge} meses` : 'Não informada'}
              </div>
            )}

            <button
              onClick={handleGenerateRecipes}
              className="w-full px-4 py-2.5 bg-[#ff005e] text-white rounded-lg font-semibold text-sm hover:bg-[#e6004d] transition-colors font-poppins"
            >
              Gerar receitas 🍽️
            </button>

            {!usage.allowed && (
              <div className="text-xs text-[#ff005e] text-center font-poppins">
                Hoje você já usou {usage.used} de {usage.limit} sugestões do seu plano.
              </div>
            )}

            {usage.allowed && (
              <div className="text-xs text-[#545454]/60 text-center font-poppins">
                Hoje você já usou {usage.used} de {usage.limit} sugestões do seu plano.
              </div>
            )}

            {showResults && (
              <div className="mt-4 space-y-3 border-t border-[#ececec]/30 pt-4">
                {MOCK_RECIPES.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-[#f9f9f9] rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#2f3a56] font-poppins">{recipe.name}</p>
                        <p className="text-xs text-[#545454]/70 mt-1">{recipe.time}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#545454] leading-relaxed">{recipe.description}</p>
                    <p className="text-xs text-[#ff005e]/80 font-poppins">{recipe.suggestedAge}</p>
                    <button
                      onClick={() => handleSaveRecipe(recipe)}
                      className="text-xs font-semibold text-[#ff005e] hover:text-[#e6004d] transition-colors"
                    >
                      Salvar no planner
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SoftCard>
  )
}

function InspiracoesDodia({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  const { addItem } = usePlannerSavedContents()
  const [selectedFocus, setSelectedFocus] = useState('')
  const [currentInspiration, setCurrentInspiration] = useState<Inspiration | null>(null)

  const handleGenerateInspiration = () => {
    if (!selectedFocus) {
      toast.info('Escolha um foco para gerar inspiração')
      return
    }

    const randomInspiration = MOCK_INSPIRATIONS[Math.floor(Math.random() * MOCK_INSPIRATIONS.length)]
    setCurrentInspiration(randomInspiration)
  }

  const handleSaveInspiration = () => {
    if (!currentInspiration) return
    addItem({
      origin: 'rotina-leve',
      type: 'insight',
      title: currentInspiration.phrase,
      payload: { action: currentInspiration.action },
    })
  }

  return (
    <SoftCard
      className="flex flex-col h-full hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] active:scale-95 transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex-1">
        <h3 className="text-base font-semibold text-[#2f3a56] mb-3 font-poppins">
          Inspirações do Dia
        </h3>
        <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins">
          Uma frase e um pequeno cuidado para hoje.
        </p>
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-[#ececec]/30 space-y-5">
          <div onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
              Escolha um foco
            </p>
            <div className="flex flex-wrap gap-2">
              {['Cansaço', 'Culpa', 'Organização', 'Conexão com o filho'].map((focus) => (
                <button
                  key={focus}
                  onClick={() =>
                    setSelectedFocus(selectedFocus === focus ? '' : focus)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedFocus === focus
                      ? 'bg-[#ffd8e6] text-[#ff005e]'
                      : 'bg-[#f5f5f5] text-[#545454] hover:bg-[#ececec]'
                  }`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleGenerateInspiration()
            }}
            className="w-full px-4 py-2.5 bg-[#ff005e] text-white rounded-lg font-semibold text-sm hover:bg-[#e6004d] transition-colors font-poppins"
          >
            Gerar inspiração 💬
          </button>

          {currentInspiration && (
            <div className="mt-4 space-y-3 border-t border-[#ececec]/30 pt-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-[#f9f9f9] rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#ff005e] uppercase tracking-wide mb-2">
                    Frase do dia
                  </p>
                  <p className="text-sm text-[#2f3a56] italic font-poppins leading-relaxed">
                    "{currentInspiration.phrase}"
                  </p>
                </div>

                <div className="border-t border-[#ececec]/30 pt-3">
                  <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                    Cuidado do dia
                  </p>
                  <p className="text-sm text-[#545454] font-poppins leading-relaxed">
                    {currentInspiration.action}
                  </p>
                </div>

                <button
                  onClick={() => handleSaveInspiration()}
                  className="text-xs font-semibold text-[#ff005e] hover:text-[#e6004d] transition-colors"
                >
                  Salvar no planner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <div className="flex justify-end mt-6 pt-2 border-t border-[#ececec]/30">
          <span className="text-sm font-semibold text-primary tracking-wide font-poppins">
            Ver mais →
          </span>
        </div>
      )}
    </SoftCard>
  )
}

export default function RotinaLevePage() {
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null)

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <div className="space-y-12 md:space-y-16">
        <Reveal delay={0}>
          <div className="pt-2">
            <div className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2f3a56] mb-3 font-poppins">
                Inspire o seu dia
              </h2>
              <p className="text-base text-[#545454] leading-relaxed font-poppins">
                Comece trazendo leveza antes de organizar tudo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              <Reveal delay={25}>
                <IdeasRapidas
                  expanded={expandedCard === 'ideas'}
                  onToggle={() => setExpandedCard(expandedCard === 'ideas' ? null : 'ideas')}
                />
              </Reveal>

              <Reveal delay={50}>
                <ReceitasInteligentes />
              </Reveal>

              <Reveal delay={75}>
                <InspiracoesDodia
                  expanded={expandedCard === 'inspirations'}
                  onToggle={() => setExpandedCard(expandedCard === 'inspirations' ? null : 'inspirations')}
                />
              </Reveal>
            </div>
          </div>
        </Reveal>

        {/* Closing message */}
        <div className="mt-12 pt-12 border-t border-[#ececec]/50">
          <p className="text-center text-base text-[#545454] leading-relaxed font-poppins">
            Organize seu dia com leveza. Pequenos passos fazem a grande diferença. <span className="text-[#ff005e] text-xl">❤️</span>
          </p>
        </div>
      </div>
    </PageTemplate>
  )
}
