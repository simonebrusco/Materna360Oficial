'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import type { KnownIconName } from '@/components/ui/AppIcon'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

interface CardItem {
  id: string
  icon: KnownIconName
  title: string
  description: string
  href?: string
}

interface CardGroup {
  label: string
  subtitle?: string
  cards: CardItem[]
}

const INSPIRATION_CARDS: CardItem[] = [
  {
    id: 'ideias-rapidas',
    title: 'Ideias Rápidas',
    description: 'Inspirações simples para deixar o dia mais leve.',
    icon: 'idea',
  },
  {
    id: 'receitas-inteligentes',
    title: 'Receitas Inteligentes',
    description: 'Você diz o ingrediente, eu te ajudo com o resto.',
    icon: 'sparkles',
  },
  {
    id: 'inspiracoes-do-dia',
    title: 'Inspirações do Dia',
    description: 'Uma frase e um pequeno cuidado para hoje.',
    icon: 'heart',
  },
]


const TIME_OPTIONS = ['5 min', '15 min', '30 min', '1h+']
const MOOD_OPTIONS = ['Cansada', 'Neutra', 'Animada']
const PARTICIPANTS_OPTIONS = ['Só eu', 'Eu e meu filho', 'Família toda']
const AGE_OPTIONS = ['0–2', '3–5', '6–8', '9+']

const SUGGESTIONS = [
  'Momento abraço: 5 minutos de conexão.',
  'Caça ao tesouro rápida pela casa.',
  'Pausa de 5 minutos só para você.',
]

const PREP_TIME_OPTIONS = ['10 min', '20 min', '30 min', '1h+']
const DIFFICULTY_OPTIONS = ['Fácil', 'Médio', 'Elaborado']
const CHILD_AGE_OPTIONS = ['0–2', '3–5', '6–8', '9+']

const RECIPE_SUGGESTIONS = [
  { name: 'Bolinho de Banana', time: '10 min', age: 'Ideal para 3–5 anos' },
  { name: 'Omelete Colorido', time: '15 min', age: 'Ideal para 6–8 anos' },
  { name: 'Creme de Frutas com Aveia', time: '5 min', age: 'Para todas as idades' },
]

export default function RotinaLevePage() {
  const router = useRouter()
  const { addItem } = usePlannerSavedContents()

  // Ideias Rápidas state
  const [isIdeasOpen, setIsIdeasOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedParticipants, setSelectedParticipants] = useState<string | null>(null)
  const [selectedAge, setSelectedAge] = useState<string | null>(null)

  // Receitas Inteligentes state
  const [isRecipesOpen, setIsRecipesOpen] = useState(false)
  const [ingredients, setIngredients] = useState('')
  const [selectedPrepTime, setSelectedPrepTime] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedChildAge, setSelectedChildAge] = useState<string | null>(null)

  // Inspirações do Dia state
  const [isInspirationOpen, setIsInspirationOpen] = useState(false)

  // Handler functions for saving to Planner
  const handleSaveIdeia = () => {
    if (!selectedTime || !selectedMood) return
    addItem({
      origin: 'rotina-leve',
      type: 'note',
      title: 'Ideias rápidas',
      payload: {
        time: selectedTime,
        mood: selectedMood,
        participants: selectedParticipants,
        age: selectedAge,
      },
    })
  }

  const handleSaveRecipe = () => {
    if (!selectedPrepTime || !selectedDifficulty) return
    addItem({
      origin: 'rotina-leve',
      type: 'recipe',
      title: 'Receita do dia',
      payload: {
        ingredients: ingredients || 'não especificado',
        prepTime: selectedPrepTime,
        difficulty: selectedDifficulty,
        childAge: selectedChildAge,
      },
    })
  }

  const handleSaveInspiracoes = () => {
    addItem({
      origin: 'rotina-leve',
      type: 'insight',
      title: 'Inspiração do dia',
      payload: {
        quote: 'Mesmo nos dias cansativos, você está fazendo o seu melhor.',
        actionSuggestion: 'Tire 2 minutos para respirar fundo e soltar os ombros.',
      },
    })
  }

  let cardIndex = 0

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <div className="space-y-12 md:space-y-16">
          {/* Inspire Section */}
          <Reveal delay={0}>
            <div className="pt-2">
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-[#2f3a56] mb-3">
                  Inspire o seu dia
                </h2>
                <p className="text-base text-[#545454] leading-relaxed">
                  Comece trazendo leveza antes de organizar tudo.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {INSPIRATION_CARDS.map((card) => {
                    const currentIndex = cardIndex
                    cardIndex += 1

                    // Special handling for Ideias Rápidas - make it expandable
                    if (card.id === 'ideias-rapidas') {
                      return (
                        <Reveal key={card.id} delay={currentIndex * 25}>
                          <SoftCard className="flex flex-col">
                            {/* Header - clickable */}
                            <button
                              onClick={() => setIsIdeasOpen(!isIdeasOpen)}
                              className="w-full text-left focus:outline-none flex flex-col"
                            >
                              <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                                {card.title}
                              </h3>
                              <p className="text-sm text-[#545454]/85 leading-relaxed">
                                {card.description}
                              </p>
                            </button>

                            {/* Ver mais label */}
                            <div className="flex justify-end mt-4">
                              <span className="text-sm font-semibold text-primary tracking-wide">
                                Ver mais →
                              </span>
                            </div>

                            {/* Expanded content */}
                            {isIdeasOpen && (
                              <div className="mt-8 pt-8 border-t border-[#ececec]/50">
                                <p className="text-sm text-[#545454]/85 leading-relaxed mb-6">
                                  Escolha algumas opções e eu te sugiro ideias rápidas de conexão.
                                </p>

                                {/* Filter: Tempo */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Quanto tempo você tem?
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {TIME_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedTime(selectedTime === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedTime === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Filter: Humor */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Como você está se sentindo?
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {MOOD_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedMood(selectedMood === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedMood === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Filter: Participantes */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Quem participa?
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {PARTICIPANTS_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedParticipants(selectedParticipants === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedParticipants === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Filter: Idade */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Idade do seu filho
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {AGE_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedAge(selectedAge === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedAge === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Generate button */}
                                <button className="w-full bg-primary text-white py-3 px-6 rounded-full font-semibold text-sm hover:shadow-[0_8px_24px_rgba(255,0,94,0.2)] active:scale-95 transition-all duration-150 mb-6">
                                  Gerar ideias ✨
                                </button>

                                {/* Suggestions */}
                                <div className="bg-[#f8f8f8] rounded-2xl p-4">
                                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                                    Sugestões que combinam com o seu momento:
                                  </h4>
                                  <ul className="space-y-2">
                                    {SUGGESTIONS.map((suggestion, idx) => (
                                      <li key={idx} className="text-sm text-[#545454]/85 flex items-start gap-2">
                                        <span className="text-primary font-bold mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Save to Planner button */}
                                <button
                                  onClick={handleSaveIdeia}
                                  disabled={!selectedTime || !selectedMood}
                                  className="w-full mt-6 rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Salvar no planner
                                </button>
                              </div>
                            )}
                          </SoftCard>
                        </Reveal>
                      )
                    }

                    // Special handling for Receitas Inteligentes - make it expandable
                    if (card.id === 'receitas-inteligentes') {
                      return (
                        <Reveal key={card.id} delay={currentIndex * 25}>
                          <SoftCard className="flex flex-col">
                            {/* Header - clickable */}
                            <button
                              onClick={() => setIsRecipesOpen(!isRecipesOpen)}
                              className="w-full text-left focus:outline-none flex flex-col"
                            >
                              <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                                {card.title}
                              </h3>
                              <p className="text-sm text-[#545454]/85 leading-relaxed">
                                {card.description}
                              </p>
                            </button>

                            {/* Ver mais label */}
                            <div className="flex justify-end mt-4">
                              <span className="text-sm font-semibold text-primary tracking-wide">
                                Ver mais →
                              </span>
                            </div>

                            {/* Expanded content */}
                            {isRecipesOpen && (
                              <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
                                {/* Ingredientes input */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Digite seus ingredientes
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ex.: banana, ovo — o que tiver na geladeira"
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    className="w-full px-4 py-2 rounded-2xl border border-[#e0e0e0] bg-[#f8f8f8] text-[#545454] text-sm placeholder-[#999] focus:outline-none focus:border-primary focus:bg-white transition-all duration-150"
                                  />
                                </div>

                                {/* Filter: Tempo de preparo */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Tempo de preparo
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {PREP_TIME_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedPrepTime(selectedPrepTime === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedPrepTime === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Filter: Dificuldade */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Nível de praticidade
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {DIFFICULTY_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedDifficulty(selectedDifficulty === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedDifficulty === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Filter: Faixa etária */}
                                <div className="mb-6">
                                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                                    Para qual idade?
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {CHILD_AGE_OPTIONS.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedChildAge(selectedChildAge === option ? null : option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          selectedChildAge === option
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Suggest button */}
                                <button className="w-full bg-primary text-white py-3 px-6 rounded-2xl font-semibold text-sm hover:shadow-[0_8px_24px_rgba(255,0,94,0.2)] active:scale-95 transition-all duration-150 mb-6">
                                  Gerar sugestões ✨
                                </button>

                                {/* Recipes suggestions */}
                                <div className="bg-[#f8f8f8] rounded-2xl p-4">
                                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                                    Receitas que combinam com o seu momento:
                                  </h4>
                                  <ul className="space-y-3">
                                    {RECIPE_SUGGESTIONS.map((recipe, idx) => (
                                      <li key={idx} className="text-sm text-[#545454]/85 flex items-start gap-2">
                                        <span className="text-primary font-bold mt-0.5">•</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-[#2f3a56]">{recipe.name}</p>
                                          <p className="text-xs text-[#545454]/70 mt-0.5">{recipe.time} — {recipe.age}</p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Save to Planner button */}
                                <button
                                  onClick={handleSaveRecipe}
                                  disabled={!selectedPrepTime || !selectedDifficulty}
                                  className="w-full mt-6 rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Salvar no planner
                                </button>
                              </div>
                            )}
                          </SoftCard>
                        </Reveal>
                      )
                    }

                    // Special handling for Inspirações do Dia - make it expandable
                    if (card.id === 'inspiracoes-do-dia') {
                      return (
                        <Reveal key={card.id} delay={currentIndex * 25}>
                          <SoftCard className="flex flex-col">
                            {/* Header - clickable */}
                            <button
                              onClick={() => setIsInspirationOpen(!isInspirationOpen)}
                              className="w-full text-left focus:outline-none flex flex-col"
                            >
                              <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                                {card.title}
                              </h3>
                              <p className="text-sm text-[#545454]/85 leading-relaxed">
                                {card.description}
                              </p>
                            </button>

                            {/* Ver mais label */}
                            <div className="flex justify-end mt-4">
                              <span className="text-sm font-semibold text-primary tracking-wide">
                                Ver mais →
                              </span>
                            </div>

                            {/* Expanded content */}
                            {isInspirationOpen && (
                              <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
                                <p className="text-sm text-[#545454]/85 leading-relaxed mb-6">
                                  Escolhi algo especial para iluminar o seu dia.
                                </p>

                                {/* Daily Inspiration Box */}
                                <div className="bg-[#f8f8f8] rounded-2xl p-4 mb-4">
                                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                                    Frase do dia
                                  </h4>
                                  <p className="text-sm text-[#545454]/85 leading-relaxed italic">
                                    &quot;Mesmo nos dias cansativos, você está fazendo o seu melhor.&quot;
                                  </p>
                                </div>

                                {/* Self-Care Reminder Box */}
                                <div className="bg-[#f8f8f8] rounded-2xl p-4 mb-6">
                                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                                    Cuidado de hoje
                                  </h4>
                                  <p className="text-sm text-[#545454]/85 leading-relaxed">
                                    Tire 2 minutos para respirar fundo e soltar os ombros.
                                  </p>
                                </div>

                                {/* Generate new inspiration button */}
                                <button className="w-full border border-[#ddd] text-[#2f3a56] py-2.5 px-6 rounded-2xl font-medium text-sm hover:bg-[#f0f0f0] transition-all duration-150 mb-3">
                                  Gerar nova inspiração ✨
                                </button>

                                {/* Save to Planner button */}
                                <button
                                  onClick={handleSaveInspiracoes}
                                  className="w-full mt-6 rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md"
                                >
                                  Salvar no planner
                                </button>
                              </div>
                            )}
                          </SoftCard>
                        </Reveal>
                      )
                    }

                    // Regular cards for other inspiration items
                    return (
                      <Reveal key={card.id} delay={currentIndex * 25}>
                        <SoftCard className="rounded-2xl p-4 md:p-6">
                          <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                            {card.title}
                          </h3>
                          <p className="text-sm text-[#545454]/85 flex-1 leading-relaxed">
                            {card.description}
                          </p>
                        </SoftCard>
                      </Reveal>
                    )
                  })}
                </div>
            </div>
          </Reveal>


          {/* Closing message */}
          <div className="mt-12 pt-12 border-t border-[#ececec]/50">
            <p className="text-center text-base text-[#545454] leading-relaxed" suppressHydrationWarning>
              Organize seu dia com leveza. Pequenos passos fazem a grande diferença. <span className="text-[#ff005e] text-xl">❤️</span>
            </p>
          </div>
        </div>
    </PageTemplate>
  )
}
