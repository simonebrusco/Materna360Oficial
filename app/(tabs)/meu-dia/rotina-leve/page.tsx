'use client'

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import type { KnownIconName } from '@/components/ui/AppIcon'

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

const CARD_GROUPS: CardGroup[] = [
  {
    label: 'ORGANIZAÇÃO DO DIA',
    subtitle: 'Comece organizando o essencial.',
    cards: [
      {
        id: 'planejar-dia',
        title: 'Planejar o Dia',
        description: 'Comece organizando as tarefas mais importantes.',
        href: '/meu-dia?focus=planejar-o-dia',
        icon: 'calendar',
      },
      {
        id: 'rotina-casa',
        title: 'Rotina da Casa',
        description: 'Tarefas do lar com praticidade e leveza.',
        href: '/meu-dia?focus=rotina-da-casa',
        icon: 'home',
      },
    ],
  },
  {
    label: 'ROTINA DA FAMÍLIA',
    subtitle: 'Acompanhe a rotina com harmonia.',
    cards: [
      {
        id: 'rotina-filho',
        title: 'Rotina do Filho',
        description: 'Organização do dia da criança com cuidado.',
        href: '/meu-dia?focus=rotina-do-filho',
        icon: 'heart',
      },
      {
        id: 'prioridades-semana',
        title: 'Prioridades da Semana',
        description: 'O que realmente importa nesta semana.',
        href: '/meu-dia?focus=prioridades-da-semana',
        icon: 'star',
      },
    ],
  },
  {
    label: 'FERRAMENTAS DA MÃE',
    subtitle: 'Pequenas ações que fazem grande diferença.',
    cards: [
      {
        id: 'checklist-mae',
        title: 'Checklist da Mãe',
        description: 'Ações que fortalecem seu dia e sua família.',
        href: '/meu-dia?focus=checklist-da-mae',
        icon: 'check',
      },
      {
        id: 'notas-listas',
        title: 'Notas & Listas',
        description: 'Anota��ões rápidas e listas essenciais.',
        href: '/meu-dia?focus=notas-e-listas',
        icon: 'bookmark',
      },
    ],
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

  // Planejar o Dia state
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [plannerItems, setPlannerItems] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: '1', text: 'Prioridade 1', done: false },
    { id: '2', text: 'Prioridade 2', done: false },
    { id: '3', text: 'Prioridade 3', done: false },
  ])
  const [plannerNewTask, setPlannerNewTask] = useState('')

  // Rotina da Casa state
  const [isCasaOpen, setIsCasaOpen] = useState(false)
  const [casaChips, setCasaChips] = useState<Array<{ id: string; text: string; selected: boolean }>>([
    { id: '1', text: 'Arrumar a cama', selected: false },
    { id: '2', text: 'Organizar a pia', selected: false },
    { id: '3', text: 'Coletar roupas', selected: false },
    { id: '4', text: 'Varrer o quarto', selected: false },
    { id: '5', text: 'Limpar superfícies', selected: false },
  ])

  let cardIndex = 0

  const handleAddPlannerTask = () => {
    if (!plannerNewTask.trim()) return
    setPlannerItems([...plannerItems, { id: String(Date.now()), text: plannerNewTask, done: false }])
    setPlannerNewTask('')
  }

  const handleTogglePlannerItem = (id: string) => {
    setPlannerItems(plannerItems.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  const handleToggleCasaChip = (id: string) => {
    setCasaChips(casaChips.map((chip) => (chip.id === id ? { ...chip, selected: !chip.selected } : chip)))
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <div className="space-y-10 md:space-y-12">
          {/* Inspire Section */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56] tracking-tight">
                    INSPIRE O SEU DIA
                  </h2>
                  <p className="text-sm md:text-base text-[#545454]/75 mt-2">
                    Comece trazendo leveza antes de organizar tudo.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {INSPIRATION_CARDS.map((card) => {
                    const currentIndex = cardIndex
                    cardIndex += 1

                    // Special handling for Ideias Rápidas - make it expandable
                    if (card.id === 'ideias-rapidas') {
                      return (
                        <Reveal key={card.id} delay={currentIndex * 25}>
                          <SoftCard className="rounded-2xl p-4 md:p-6 flex flex-col">
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
                            <div className="flex justify-end mt-2">
                              <span className="text-xs font-semibold text-primary/85 tracking-wide">
                                Ver mais →
                              </span>
                            </div>

                            {/* Expanded content */}
                            {isIdeasOpen && (
                              <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
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
                                <button className="w-full bg-primary text-white py-3 px-6 rounded-2xl font-semibold text-sm hover:shadow-[0_8px_24px_rgba(255,0,94,0.2)] active:scale-95 transition-all duration-150 mb-6">
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
                                  onClick={() => router.push('/meu-dia?fromRotina=ideias')}
                                  className="w-full mt-6 border border-[#ddd] text-[#2f3a56] py-2.5 px-6 rounded-2xl font-medium text-sm hover:bg-[#f0f0f0] transition-all duration-150"
                                >
                                  Abrir no Planner
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
                          <SoftCard className="rounded-2xl p-4 md:p-6 flex flex-col">
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
                            <div className="flex justify-end mt-2">
                              <span className="text-xs font-semibold text-primary/85 tracking-wide">
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
                                  onClick={() => router.push('/meu-dia?fromRotina=receitas')}
                                  className="w-full mt-6 border border-[#ddd] text-[#2f3a56] py-2.5 px-6 rounded-2xl font-medium text-sm hover:bg-[#f0f0f0] transition-all duration-150"
                                >
                                  Abrir no Planner
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
                          <SoftCard className="rounded-2xl p-4 md:p-6 flex flex-col">
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
                            <div className="flex justify-end mt-2">
                              <span className="text-xs font-semibold text-primary/85 tracking-wide">
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
                                    "Mesmo nos dias cansativos, você está fazendo o seu melhor."
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
                                  onClick={() => router.push('/meu-dia?fromRotina=inspiracao')}
                                  className="w-full border border-[#ddd] text-[#2f3a56] py-2.5 px-6 rounded-2xl font-medium text-sm hover:bg-[#f0f0f0] transition-all duration-150"
                                >
                                  Abrir no Planner
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
            </SoftCard>
          </Reveal>

          {/* Main Card Groups */}
          {CARD_GROUPS.map((group, groupIdx) => (
            <Reveal key={group.label} delay={(groupIdx + 1) * 50}>
              <SoftCard className="rounded-3xl p-6 md:p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56] tracking-tight">
                      {group.label}
                    </h2>
                    {group.subtitle && (
                      <p className="text-sm md:text-base text-[#545454]/75 mt-2">
                        {group.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {group.cards.map((card) => {
                      const currentIndex = cardIndex
                      cardIndex += 1

                      // Special handling for Planejar o Dia
                      if (card.id === 'planejar-dia') {
                        return (
                          <Reveal key={card.id} delay={currentIndex * 25}>
                            <SoftCard className="rounded-2xl p-4 md:p-6 flex flex-col">
                              {/* Header - clickable */}
                              <button
                                onClick={() => setIsPlannerOpen(!isPlannerOpen)}
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
                              <div className="flex justify-end mt-2">
                                <span className="text-xs font-semibold text-primary/85 tracking-wide">
                                  Ver mais →
                                </span>
                              </div>

                              {/* Expanded content */}
                              {isPlannerOpen && (
                                <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
                                  <p className="text-sm text-[#545454]/85 leading-relaxed mb-6">
                                    Organize suas prioridades com leveza.
                                  </p>

                                  {/* Checklist */}
                                  <div className="space-y-3 mb-6">
                                    {plannerItems.map((item) => (
                                      <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={item.done}
                                          onChange={() => handleTogglePlannerItem(item.id)}
                                          className="w-4 h-4 rounded border-[#ddd] text-primary focus:ring-primary/50"
                                        />
                                        <span
                                          className={`text-sm transition-all ${
                                            item.done
                                              ? 'line-through text-[#545454]/50'
                                              : 'text-[#545454]'
                                          }`}
                                        >
                                          {item.text}
                                        </span>
                                      </label>
                                    ))}
                                  </div>

                                  {/* Input + Add button */}
                                  <div className="flex gap-2 mb-6">
                                    <input
                                      type="text"
                                      value={plannerNewTask}
                                      onChange={(e) => setPlannerNewTask(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddPlannerTask()}
                                      placeholder="Adicionar nova tarefa…"
                                      className="flex-1 rounded-2xl bg-white/90 text-sm text-[#2f3a56] placeholder-[#545454]/50 border border-[#ddd] px-4 py-2.5 transition duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/25 focus:outline-none"
                                    />
                                    <button
                                      onClick={handleAddPlannerTask}
                                      className="px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity duration-150"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Abrir no Planner button */}
                                  <button
                                    onClick={() => router.push('/meu-dia')}
                                    className="w-full border border-[#ddd] text-[#2f3a56] py-2.5 px-6 rounded-2xl font-medium text-sm hover:bg-[#f0f0f0] transition-all duration-150"
                                  >
                                    Abrir no Planner
                                  </button>
                                </div>
                              )}
                            </SoftCard>
                          </Reveal>
                        )
                      }

                      // Special handling for Rotina da Casa
                      if (card.id === 'rotina-casa') {
                        return (
                          <Reveal key={card.id} delay={currentIndex * 25}>
                            <SoftCard className="rounded-2xl p-4 md:p-6 flex flex-col">
                              {/* Header - clickable */}
                              <button
                                onClick={() => setIsCasaOpen(!isCasaOpen)}
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
                              <div className="flex justify-end mt-2">
                                <span className="text-xs font-semibold text-primary/85 tracking-wide">
                                  Ver mais →
                                </span>
                              </div>

                              {/* Expanded content */}
                              {isCasaOpen && (
                                <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
                                  <p className="text-sm text-[#545454]/85 leading-relaxed mb-6">
                                    Tarefas rápidas para deixar a casa mais leve.
                                  </p>

                                  {/* Toggle chips */}
                                  <div className="flex flex-wrap gap-2 mb-6">
                                    {casaChips.map((chip) => (
                                      <button
                                        key={chip.id}
                                        onClick={() => handleToggleCasaChip(chip.id)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                                          chip.selected
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-[#f0f0f0] text-[#545454] hover:bg-[#e8e8e8]'
                                        }`}
                                      >
                                        {chip.text}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Dica do dia box */}
                                  <div className="bg-[#f8f8f8] rounded-2xl p-4 mb-6">
                                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                                      Dica do dia
                                    </h4>
                                    <p className="text-sm text-[#545454]/85 leading-relaxed">
                                      Escolha apenas o essencial. O resto pode esperar.
                                    </p>
                                  </div>

                                  {/* Abrir no Planner button */}
                                  <button
                                    onClick={() => router.push('/meu-dia')}
                                    className="w-full border border-[#ddd] text-[#2f3a56] py-2.5 px-6 rounded-2xl font-medium text-sm hover:bg-[#f0f0f0] transition-all duration-150"
                                  >
                                    Abrir no Planner
                                  </button>
                                </div>
                              )}
                            </SoftCard>
                          </Reveal>
                        )
                      }

                      // Default card rendering for other cards
                      return (
                        <Reveal key={card.id} delay={currentIndex * 25}>
                          <Link href={card.href || '#'}>
                            <SoftCard className="rounded-2xl p-4 md:p-6 hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] active:scale-95 cursor-pointer">
                              <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                                {card.title}
                              </h3>
                              <p className="text-sm text-[#545454]/85 mb-4 flex-1 leading-relaxed">
                                {card.description}
                              </p>
                              <div className="flex justify-end">
                                <span className="text-xs font-semibold text-primary/85 tracking-wide inline-flex items-center gap-1">
                                  Ver mais →
                                </span>
                              </div>
                            </SoftCard>
                          </Link>
                        </Reveal>
                      )
                    })}
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          ))}

          {/* Closing message */}
          <div className="mt-4 pt-6 border-t border-white/40">
            <p className="text-center text-sm text-[#545454]/70 leading-relaxed">
              Organize seu dia com leveza. Pequenos passos fazem a grande diferença. 💚
            </p>
          </div>
        </div>
    </PageTemplate>
  )
}
