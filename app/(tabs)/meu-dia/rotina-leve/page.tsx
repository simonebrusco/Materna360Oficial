'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface CardItem {
  id: string
  title: string
  description: string
  icon: KnownIconName
}

const INSPIRATION_CARDS: CardItem[] = [
  {
    id: 'ideias-rapidas',
    title: 'Ideias Rápidas',
    description: 'Inspirações simples para deixar o dia mais leve.',
    icon: 'lightbulb',
  },
  {
    id: 'receitas-inteligentes',
    title: 'Receitas Inteligentes',
    description: 'Você diz o ingrediente, eu te ajudo com o resto.',
    icon: 'leaf',
  },
  {
    id: 'inspiracoes-do-dia',
    title: 'Inspirações do Dia',
    description: 'Uma frase e um pequeno cuidado para hoje.',
    icon: 'sparkles',
  },
]

const ORGANIZATION_CARDS: CardItem[] = [
  {
    id: 'planejar-o-dia',
    title: 'Planejar o Dia',
    description: 'Organize o essencial sem se sobrecarregar.',
    icon: 'calendar',
  },
  {
    id: 'rotina-da-casa',
    title: 'Rotina da Casa',
    description: 'Tarefas do lar com mais praticidade.',
    icon: 'home',
  },
  {
    id: 'rotina-da-familia',
    title: 'Rotina da Família',
    description: 'Keep track of the family schedule.',
    icon: 'heart',
  },
]

const TOOLS_CARDS: CardItem[] = [
  {
    id: 'prioridades-semana',
    title: 'Prioridades da Semana',
    description: 'What really matters this week.',
    icon: 'star',
  },
  {
    id: 'checklist-mae',
    title: 'Checklist da Mãe',
    description: 'Your essential tasks.',
    icon: 'check',
  },
  {
    id: 'notas-listas',
    title: 'Notas & Listas',
    description: 'Quick notes and checklists.',
    icon: 'bookmark',
  },
]

const FILTER_OPTIONS = ['Hoje', 'Pessoal', 'Casa', 'Filhos', 'Semana']

export default function RotinaLevePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Hoje')
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null)
  const [cardData, setCardData] = useState<Record<string, string>>({})
  const [recurringTasks, setRecurringTasks] = useState('')
  const [reminders, setReminders] = useState('')

  // Ideias Rápidas filters
  const [ideiasFilters, setIdeiasFilters] = useState({
    timeAvailable: null as string | null,
    feeling: null as string | null,
    participates: null as string | null,
    childAge: null as string | null,
  })
  const [showIdeiasResults, setShowIdeiasResults] = useState(false)

  // Receitas Inteligentes filters
  const [receitasInput, setReceitasInput] = useState('')
  const [receitasIngredients, setReceitasIngredients] = useState<string[]>([])
  const [receitasTime, setReceitasTime] = useState<string | null>(null)
  const [receitasWhoEats, setReceitasWhoEats] = useState<string | null>(null)
  const [receitasRestrictions, setReceitasRestrictions] = useState<string[]>([])
  const [showReceitasResults, setShowReceitasResults] = useState(false)

  // Inspirações do Dia self-care checklist
  const [selfCareChecklist, setSelfCareChecklist] = useState({
    'agua-em-paz': false,
    'pausa-silencio': false,
    'conversa-olhos': false,
  })

  // Planejar o Dia
  const [planejarDate, setPlanejarDate] = useState(getBrazilDateKey())
  const [planejarPriority, setPlanejarPriority] = useState('')
  const [planejarTasks, setPlanejarTasks] = useState<string[]>([])
  const [planejarTaskInput, setPlanejarTaskInput] = useState('')

  // Rotina da Casa
  const [rotinaCasaDays, setRotinaCasaDays] = useState<string[]>([])
  const [rotinaCasaTasks, setRotinaCasaTasks] = useState({
    'lavar-louça': false,
    'cozinha': false,
    'roupa': false,
    'organizar-brinquedos': false,
  })
  const [rotinaCasaNewTask, setRotinaCasaNewTask] = useState('')
  const [rotinaCasaCustomTasks, setRotinaCasaCustomTasks] = useState<{ id: string; label: string; checked: boolean }[]>([])

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    // Load all card data
    const cardIds = [
      ...INSPIRATION_CARDS.map((c) => c.id),
      ...ORGANIZATION_CARDS.map((c) => c.id),
      ...TOOLS_CARDS.map((c) => c.id),
    ]

    const loadedData: Record<string, string> = {}
    cardIds.forEach((id) => {
      const key = `rotina-leve:${currentDateKey}:${id}`
      const saved = load(key)
      if (typeof saved === 'string') loadedData[id] = saved
    })

    setCardData(loadedData)

    const recurringTasksKey = `rotina-leve:${currentDateKey}:recurringTasks`
    const remindersKey = `rotina-leve:${currentDateKey}:reminders`

    const savedRecurringTasks = load(recurringTasksKey)
    const savedReminders = load(remindersKey)

    if (typeof savedRecurringTasks === 'string') setRecurringTasks(savedRecurringTasks)
    if (typeof savedReminders === 'string') setReminders(savedReminders)
  }, [isHydrated, currentDateKey])

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(expandedAccordion === id ? null : id)
  }

  const handleSaveCard = (id: string) => {
    const content = cardData[id]
    if (!content?.trim()) return

    const key = `rotina-leve:${currentDateKey}:${id}`
    save(key, content)

    try {
      track('rotina_leve.card_saved', { cardId: id, tab: 'meu-dia-rotina-leve' })
    } catch {}

    toast.success('Salvo no Planner!')
  }

  const handleSaveRecurringTasks = () => {
    if (!recurringTasks.trim()) return
    const recurringTasksKey = `rotina-leve:${currentDateKey}:recurringTasks`
    save(recurringTasksKey, recurringTasks)
    try {
      track('rotina_leve.recurring_tasks.saved', { tab: 'meu-dia-rotina-leve' })
    } catch {}
    toast.success('Tarefas salvas!')
  }

  const handleSaveReminders = () => {
    if (!reminders.trim()) return
    const remindersKey = `rotina-leve:${currentDateKey}:reminders`
    save(remindersKey, reminders)
    try {
      track('rotina_leve.reminders.saved', { tab: 'meu-dia-rotina-leve' })
    } catch {}
    toast.success('Lembretes salvos!')
  }

  const renderCardContent = (cardId: string) => {
    const content = cardData[cardId] || ''

    switch (cardId) {
      case 'ideias-rapidas':
        return (
          <div onClick={(e) => e.stopPropagation()} className="space-y-4">
            {/* Introduction Paragraph */}
            <p className="text-sm text-[#545454] leading-relaxed">
              Escolha algumas opções abaixo e eu te sugiro ideias rápidas para você e sua família.
            </p>

            {/* Filter Section 1: Time Available */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Quanto tempo você tem hoje?
              </label>
              <div className="flex flex-wrap gap-2">
                {['5 min', '15 min', '30 min', '1h+'].map((time) => (
                  <button
                    key={time}
                    onClick={() =>
                      setIdeiasFilters({
                        ...ideiasFilters,
                        timeAvailable: ideiasFilters.timeAvailable === time ? null : time,
                      })
                    }
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      ideiasFilters.timeAvailable === time
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section 2: How You Feel */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Como você está se sentindo?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Cansada', 'Neutra', 'Animada'].map((feeling) => (
                  <button
                    key={feeling}
                    onClick={() =>
                      setIdeiasFilters({
                        ...ideiasFilters,
                        feeling: ideiasFilters.feeling === feeling ? null : feeling,
                      })
                    }
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      ideiasFilters.feeling === feeling
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {feeling}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section 3: Who Participates */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Quem participa?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Só eu', 'Eu e meu filho', 'Família toda'].map((participant) => (
                  <button
                    key={participant}
                    onClick={() =>
                      setIdeiasFilters({
                        ...ideiasFilters,
                        participates: ideiasFilters.participates === participant ? null : participant,
                      })
                    }
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      ideiasFilters.participates === participant
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {participant}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section 4: Child Age */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Idade do seu filho (principal):
              </label>
              <div className="flex flex-wrap gap-2">
                {['0–2', '3–5', '6–8', '9+'].map((age) => (
                  <button
                    key={age}
                    onClick={() =>
                      setIdeiasFilters({
                        ...ideiasFilters,
                        childAge: ideiasFilters.childAge === age ? null : age,
                      })
                    }
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      ideiasFilters.childAge === age
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Ideas Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowIdeiasResults(true)
                try {
                  track('ideias_rapidas.generated', {
                    filters: ideiasFilters,
                    tab: 'meu-dia-rotina-leve',
                  })
                } catch {}
              }}
              className="w-full px-4 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Gerar ideias para hoje
            </button>

            {/* Results Section */}
            {showIdeiasResults && (
              <div className="space-y-3 pt-4 border-t border-white/40">
                <h4 className="text-sm font-semibold text-[#2f3a56]">
                  Sugestões para você agora:
                </h4>
                <div className="space-y-2">
                  {[
                    'Momento abraço: 5 minutos em silêncio com seu filho no colo.',
                    'Caça ao tesouro rápida pela casa com 3 objetos.',
                    'Um café em silêncio só seu, sem culpa.',
                  ].map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white/60 border border-white/40"
                    >
                      <p className="text-sm text-[#2f3a56] leading-relaxed">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        track('ideias_rapidas.saved_idea', {
                          tab: 'meu-dia-rotina-leve',
                        })
                      } catch {}
                      toast.success('Ideia salva no Planner!')
                    }}
                    className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
                  >
                    Salvar ideia no planner
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIdeiasFilters({
                        timeAvailable: null,
                        feeling: null,
                        participates: null,
                        childAge: null,
                      })
                      setShowIdeiasResults(false)
                    }}
                    className="w-full px-4 py-2 rounded-full text-[#2f3a56] font-medium text-sm hover:bg-white/60 transition-all duration-200"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 'receitas-inteligentes':
        const handleAddIngredient = () => {
          if (receitasInput.trim() && !receitasIngredients.includes(receitasInput.trim())) {
            setReceitasIngredients([...receitasIngredients, receitasInput.trim()])
            setReceitasInput('')
          }
        }

        const handleRemoveIngredient = (ingredient: string) => {
          setReceitasIngredients(receitasIngredients.filter((ing) => ing !== ingredient))
        }

        const handleToggleRestriction = (restriction: string) => {
          if (receitasRestrictions.includes(restriction)) {
            setReceitasRestrictions(receitasRestrictions.filter((r) => r !== restriction))
          } else {
            setReceitasRestrictions([...receitasRestrictions, restriction])
          }
        }

        const handleClearReceitasFields = () => {
          setReceitasInput('')
          setReceitasIngredients([])
          setReceitasTime(null)
          setReceitasWhoEats(null)
          setReceitasRestrictions([])
          setShowReceitasResults(false)
        }

        return (
          <div onClick={(e) => e.stopPropagation()} className="space-y-4">
            {/* Introduction Paragraph */}
            <p className="text-sm text-[#545454] leading-relaxed">
              Me conta o que você tem aí e eu te ajudo com opções práticas.
            </p>

            {/* Input Section 1 — Ingredients */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Ingredientes que você tem
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={receitasInput}
                  onChange={(e) => setReceitasInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddIngredient()
                    }
                  }}
                  placeholder="Ex.: frango, batata, cenoura…"
                  className="flex-1 px-3 py-2 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddIngredient()
                  }}
                  className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 transition-all duration-200"
                >
                  +
                </button>
              </div>
              {receitasIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {receitasIngredients.map((ingredient) => (
                    <div
                      key={ingredient}
                      className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-2"
                    >
                      {ingredient}
                      <button
                        onClick={() => handleRemoveIngredient(ingredient)}
                        className="hover:text-primary/70"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Section 2 — Time Available */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Tempo disponível
              </label>
              <div className="flex flex-wrap gap-2">
                {['15 min', '30 min', '45 min', '1h+'].map((time) => (
                  <button
                    key={time}
                    onClick={() =>
                      setReceitasTime(receitasTime === time ? null : time)
                    }
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      receitasTime === time
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Section 3 — Who will eat */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Quem vai comer?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Só adultos', 'Crianças', 'Família toda'].map((option) => (
                  <button
                    key={option}
                    onClick={() =>
                      setReceitasWhoEats(receitasWhoEats === option ? null : option)
                    }
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      receitasWhoEats === option
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Section 4 — Restrictions (optional) */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Alguma restrição?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Sem lactose', 'Sem glúten', 'Vegetariana', 'Nenhuma'].map((restriction) => (
                  <button
                    key={restriction}
                    onClick={() => handleToggleRestriction(restriction)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      receitasRestrictions.includes(restriction)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] border border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {restriction}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary button — Sugerir receita */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowReceitasResults(true)
                try {
                  track('receitas_inteligentes.generated', {
                    ingredients: receitasIngredients,
                    time: receitasTime,
                    whoEats: receitasWhoEats,
                    restrictions: receitasRestrictions,
                    tab: 'meu-dia-rotina-leve',
                  })
                } catch {}
              }}
              className="w-full px-4 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Sugerir receita
            </button>

            {/* Results Section */}
            {showReceitasResults && (
              <div className="space-y-4 pt-4 border-t border-white/40">
                {/* Recipe Result Block */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-[#2f3a56]">
                    Frango cremoso rápido
                  </h4>

                  {/* Data Block with vertical spacing */}
                  <div className="p-4 rounded-2xl bg-white/60 border border-white/40 space-y-4">
                    {/* Modo de Preparo */}
                    <div>
                      <p className="text-xs font-semibold text-[#545454] mb-2">
                        Modo de preparo:
                      </p>
                      <p className="text-sm text-[#2f3a56] leading-relaxed">
                        Fritar o frango em cubinhos com alho e cebola. Adicionar cenoura e batata já cozidas, depois creme de leite ou iogurte. Temperar com sal e deixar 5 minutos no fogo baixo.
                      </p>
                    </div>

                    {/* Tempo Aproximado */}
                    <div>
                      <p className="text-xs font-semibold text-[#545454] mb-1">
                        Tempo aproximado:
                      </p>
                      <p className="text-sm text-[#2f3a56]">
                        30 min
                      </p>
                    </div>

                    {/* Nível de Dificuldade */}
                    <div>
                      <p className="text-xs font-semibold text-[#545454] mb-1">
                        Nível de dificuldade:
                      </p>
                      <p className="text-sm text-[#2f3a56]">
                        Fácil
                      </p>
                    </div>

                    {/* Faixa Etária */}
                    <div>
                      <p className="text-xs font-semibold text-[#545454] mb-1">
                        Faixa etária:
                      </p>
                      <p className="text-sm text-[#2f3a56]">
                        3+
                      </p>
                    </div>

                    {/* Porções */}
                    <div>
                      <p className="text-xs font-semibold text-[#545454] mb-1">
                        Porções:
                      </p>
                      <p className="text-sm text-[#2f3a56]">
                        2–3
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        track('receitas_inteligentes.added_to_planner', {
                          recipe: 'Frango cremoso rápido',
                          tab: 'meu-dia-rotina-leve',
                        })
                      } catch {}
                      toast.success('Receita adicionada ao planner!')
                    }}
                    className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
                  >
                    Adicionar ao planner
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        track('receitas_inteligentes.generate_new', {
                          tab: 'meu-dia-rotina-leve',
                        })
                      } catch {}
                      setShowReceitasResults(false)
                    }}
                    className="w-full px-4 py-2 rounded-full text-[#2f3a56] font-medium text-sm hover:bg-white/60 transition-all duration-200"
                  >
                    Gerar outra sugestão
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearReceitasFields()
                    }}
                    className="w-full px-4 py-2 rounded-full text-[#2f3a56] font-medium text-sm hover:bg-white/60 transition-all duration-200"
                  >
                    Limpar campos
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 'inspiracoes-do-dia':
        return (
          <div onClick={(e) => e.stopPropagation()} className="space-y-4">
            {/* Introduction Paragraph */}
            <p className="text-sm text-[#545454] leading-relaxed">
              Um lembrete rápido para você respirar e seguir com mais leveza.
            </p>

            {/* Daily Quote Display Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFE5EF]/40 to-white border border-white/40">
              <p className="text-sm italic text-[#2f3a56] leading-relaxed text-center">
                "Você não precisa dar conta de tudo para ser uma mãe incrível."
              </p>
            </div>

            {/* Self-Care Checklist */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Meu pequeno cuidado de hoje:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'agua-em-paz', label: 'Beber água em paz' },
                  { id: 'pausa-silencio', label: 'Pausa de 5 min em silêncio' },
                  { id: 'conversa-olhos', label: 'Uma conversa olhando nos olhos do meu filho' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selfCareChecklist[item.id as keyof typeof selfCareChecklist]}
                      onChange={(e) =>
                        setSelfCareChecklist({
                          ...selfCareChecklist,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-[#2f3a56] font-medium">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Primary Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                try {
                  track('inspiracoes_do_dia.saved_reminder', {
                    selfCareChecks: Object.entries(selfCareChecklist)
                      .filter(([_, checked]) => checked)
                      .map(([key, _]) => key),
                    tab: 'meu-dia-rotina-leve',
                  })
                } catch {}
                toast.success('Lembrete salvo para hoje!')
              }}
              className="w-full px-4 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Salvar no planner como lembrete de hoje
            </button>
          </div>
        )

      case 'planejar-o-dia':
        const handleAddPlanejarTask = () => {
          if (planejarTaskInput.trim() && planejarTasks.length < 5) {
            setPlanejarTasks([...planejarTasks, planejarTaskInput.trim()])
            setPlanejarTaskInput('')
          }
        }

        const handleRemovePlanejarTask = (index: number) => {
          setPlanejarTasks(planejarTasks.filter((_, i) => i !== index))
        }

        const handleClearPlanejarList = () => {
          setPlanejarPriority('')
          setPlanejarTasks([])
          setPlanejarTaskInput('')
        }

        return (
          <div onClick={(e) => e.stopPropagation()} className="space-y-4">
            {/* Introduction Paragraph */}
            <p className="text-sm text-[#545454] leading-relaxed">
              Escolha o que realmente importa hoje. O resto pode ficar para depois.
            </p>

            {/* Date Field */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-2">
                Dia que você quer organizar
              </label>
              <input
                type="date"
                value={planejarDate}
                onChange={(e) => setPlanejarDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Priority Field */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-2">
                Prioridade do dia
              </label>
              <input
                type="text"
                value={planejarPriority}
                onChange={(e) => setPlanejarPriority(e.target.value)}
                placeholder="Ex.: Dedicar tempo de qualidade com meu filho"
                className="w-full px-3 py-2 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Essential Tasks List */}
            <div>
              <label className="text-xs font-semibold text-[#2f3a56] block mb-3">
                Tarefas essenciais
              </label>

              {/* Task Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={planejarTaskInput}
                  onChange={(e) => setPlanejarTaskInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && planejarTasks.length < 5) {
                      e.preventDefault()
                      handleAddPlanejarTask()
                    }
                  }}
                  placeholder="Digite uma tarefa essencial…"
                  disabled={planejarTasks.length >= 5}
                  className="flex-1 px-3 py-2 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddPlanejarTask()
                  }}
                  disabled={planejarTasks.length >= 5}
                  className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 transition-all duration-200 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              {/* Tasks List */}
              {planejarTasks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {planejarTasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200"
                    >
                      <span className="text-sm text-[#2f3a56]">
                        {index + 1}. {task}
                      </span>
                      <button
                        onClick={() => handleRemovePlanejarTask(index)}
                        className="text-primary hover:text-primary/70 font-medium text-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Task Count Indicator */}
              {planejarTasks.length > 0 && (
                <p className="text-xs text-[#545454] mb-3">
                  {planejarTasks.length} de 5 tarefas adicionadas
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (planejarPriority.trim() && planejarTasks.length > 0) {
                    try {
                      track('planejar_o_dia.saved', {
                        priority: planejarPriority,
                        tasksCount: planejarTasks.length,
                        date: planejarDate,
                        tab: 'meu-dia-rotina-leve',
                      })
                    } catch {}
                    toast.success('Plano do dia salvo!')
                  }
                }}
                className="w-full px-4 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md disabled:opacity-50"
              >
                Salvar no planner
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearPlanejarList()
                }}
                className="w-full px-4 py-2 rounded-full text-[#2f3a56] font-medium text-sm hover:bg-white/60 transition-all duration-200"
              >
                Limpar lista
              </button>
            </div>
          </div>
        )

      case 'rotina-da-casa':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              value={content}
              onChange={(e) => setCardData({ ...cardData, [cardId]: e.target.value })}
              placeholder="Tarefas da casa para hoje..."
              className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-3"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSaveCard(cardId)
              }}
              className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Salvar no Planner
            </button>
          </div>
        )

      case 'rotina-da-familia':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              value={content}
              onChange={(e) => setCardData({ ...cardData, [cardId]: e.target.value })}
              placeholder="Rotina e atividades da família..."
              className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-3"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSaveCard(cardId)
              }}
              className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Salvar no Planner
            </button>
          </div>
        )

      case 'prioridades-semana':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              value={content}
              onChange={(e) => setCardData({ ...cardData, [cardId]: e.target.value })}
              placeholder="Minhas 3 prioridades da semana..."
              className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-3"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSaveCard(cardId)
              }}
              className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Salvar no Planner
            </button>
          </div>
        )

      case 'checklist-mae':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              value={content}
              onChange={(e) => setCardData({ ...cardData, [cardId]: e.target.value })}
              placeholder="Suas tarefas essenciais..."
              className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-3"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSaveCard(cardId)
              }}
              className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Salvar no Planner
            </button>
          </div>
        )

      case 'notas-listas':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              value={content}
              onChange={(e) => setCardData({ ...cardData, [cardId]: e.target.value })}
              placeholder="Anotações rápidas e listas..."
              className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-3"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSaveCard(cardId)
              }}
              className="w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
              Salvar no Planner
            </button>
          </div>
        )

      default:
        return null
    }
  }

  const renderExpandableCard = (card: CardItem, index: number, delay: number) => (
    <Reveal key={card.id} delay={delay}>
      <div
        className="rounded-3xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={() => toggleAccordion(card.id)}
      >
        <div className="flex items-start gap-3 p-6 md:p-8">
          <AppIcon
            name={card.icon}
            size={24}
            className="text-primary flex-shrink-0 mt-1"
            decorative
          />
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1">
              {card.title}
            </h3>
            <p className="text-sm text-[#545454] leading-relaxed">
              {card.description}
            </p>
          </div>
          <span
            className={`text-lg font-semibold text-primary ml-3 transition-transform duration-200 flex-shrink-0 ${
              expandedAccordion === card.id ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </div>

        {expandedAccordion === card.id && (
          <div className="border-t border-white/40 p-6 md:p-8 bg-white/30">
            {renderCardContent(card.id)}
          </div>
        )}
      </div>
    </Reveal>
  )

  if (!isHydrated) {
    return null
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve, Dia Mais Tranquilo"
      subtitle="Simplify your day with clarity, kindness and practicality. Here, you organize routines without pressure."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* SECTION 1 — Inspire o Seu Dia */}
          <Reveal delay={0}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Inspire o Seu Dia
              </h2>
              <p className="text-sm text-[#545454]">
                Comece com ideias, receitas e motivação.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {INSPIRATION_CARDS.map((card, index) =>
              renderExpandableCard(card, index, 50 + index * 25),
            )}
          </div>

          {/* SECTION 2 — Organização do Dia */}
          <Reveal delay={125}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Organização do Dia
              </h2>
              <p className="text-sm text-[#545454]">
                Comece a organizar sua rotina com leveza.
              </p>
            </div>
          </Reveal>

          {/* Filter Pills */}
          <Reveal delay={150}>
            <div className="flex flex-wrap gap-2 mb-2">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeFilter === filter
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white/60 text-[#2f3a56] hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {ORGANIZATION_CARDS.map((card, index) =>
              renderExpandableCard(card, index, 200 + index * 25),
            )}
          </div>

          {/* SECTION 3 — Ferramentas da Mãe */}
          <Reveal delay={275}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Ferramentas da Mãe
              </h2>
              <p className="text-sm text-[#545454]">
                Pequenas ações que fazem grande diferença.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {TOOLS_CARDS.map((card, index) =>
              renderExpandableCard(card, index, 325 + index * 25),
            )}
          </div>

          {/* SECTION 4 — Extras Inteligentes (Accordion) */}
          <Reveal delay={400}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Extras Inteligentes
              </h2>
              <p className="text-sm text-[#545454]">
                Recursos adicionais, quando você precisar.
              </p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {/* Accordion Item 1 — Tarefas Recorrentes */}
            <Reveal delay={450}>
              <div
                className="rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => toggleAccordion('tarefas-recorrentes')}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                      Tarefas Recorrentes
                    </h4>
                    <p className="text-xs text-[#545454]">
                      Suas tarefas que se repetem regularmente.
                    </p>
                  </div>
                  <span
                    className={`text-lg font-semibold text-primary ml-3 transition-transform duration-200 ${
                      expandedAccordion === 'tarefas-recorrentes' ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>

                {expandedAccordion === 'tarefas-recorrentes' && (
                  <div className="border-t border-white/40 p-4 bg-white/30">
                    <textarea
                      value={recurringTasks}
                      onChange={(e) => setRecurringTasks(e.target.value)}
                      placeholder="Escreva suas tarefas recorrentes aqui..."
                      className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveRecurringTasks()
                      }}
                      className="mt-3 w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
                    >
                      Salvar no Planner
                    </button>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Accordion Item 2 — Lembretes Inteligentes */}
            <Reveal delay={475}>
              <div
                className="rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => toggleAccordion('lembretes-inteligentes')}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                      Lembretes Inteligentes
                    </h4>
                    <p className="text-xs text-[#545454]">
                      Lembretes personalizados para seu dia.
                    </p>
                  </div>
                  <span
                    className={`text-lg font-semibold text-primary ml-3 transition-transform duration-200 ${
                      expandedAccordion === 'lembretes-inteligentes' ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>

                {expandedAccordion === 'lembretes-inteligentes' && (
                  <div className="border-t border-white/40 p-4 bg-white/30">
                    <textarea
                      value={reminders}
                      onChange={(e) => setReminders(e.target.value)}
                      placeholder="Escreva seus lembretes aqui..."
                      className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveReminders()
                      }}
                      className="mt-3 w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
                    >
                      Salvar no Planner
                    </button>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
