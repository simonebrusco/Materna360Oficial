'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  ChefHat,
  Heart,
  HeartOff,
  Loader2,
  PiggyBank,
  Share2,
  ShoppingCart,
  Sparkles,
  Timer,
  UtensilsCrossed,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

import {
  type AgeBucket,
  type PlanTier,
  type RecipeBudget,
  type RecipeCategory,
  type RecipeEnergy,
  type RecipeSuggestion,
  type RecipesApiResponse,
  mapMonthsToBucket,
  formatBadgeLabel,
} from './utils'

const CATEGORY_OPTIONS: { value: RecipeCategory; label: string; icon: string }[] = [
  { value: 'refeicao', label: 'Refeição', icon: '🍽️' },
  { value: 'cafe_lanche', label: 'Café / Lanche', icon: '🥪' },
  { value: 'sobremesa', label: 'Sobremesa', icon: '🍓' },
  { value: 'bebida', label: 'Bebida', icon: '🥤' },
]

const TIME_OPTIONS = [10, 20, 30]
const EQUIPMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'fogao', label: 'fogão' },
  { value: 'forno', label: 'forno' },
  { value: 'airfryer', label: 'airfryer' },
  { value: 'microondas', label: 'micro-ondas' },
]
const DIET_OPTIONS: { value: string; label: string }[] = [
  { value: 'sem_lactose', label: 'sem lactose' },
  { value: 'sem_gluten', label: 'sem glúten' },
  { value: 'vegetariano', label: 'vegetariano' },
  { value: 'vegano', label: 'vegano' },
  { value: 'sem_ovos', label: 'sem ovos' },
]
const ENERGY_OPTIONS: { value: RecipeEnergy; label: string }[] = [
  { value: 'exausta', label: 'Exausta' },
  { value: 'normal', label: 'Normal' },
  { value: 'animada', label: 'Animada' },
]
const BUDGET_OPTIONS: { value: RecipeBudget; label: string }[] = [
  { value: '$', label: '$ (básico)' },
  { value: '$$', label: '$$ (intermediário)' },
  { value: '$$$', label: '$$$ (especial)' },
]

const chipClasses = (active: boolean) =>
  `inline-flex h-[26px] items-center rounded-full border px-[12px] text-[12px] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 md:h-[28px] md:px-4 md:text-[13px] ${
    active
      ? 'border-primary bg-primary text-white shadow-[0_0_0_1px_rgba(255,0,94,0.35)]'
      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-primary/40 hover:text-primary'
  }`

const HISTORY_STORAGE_KEY = 'receitinhas:history'
const FAVORITES_STORAGE_KEY = 'receitinhas:favorites'
const SHOPPING_LIST_STORAGE_KEY = 'materna360:shopping-list'
const PLAN_STORAGE_KEY = 'receitinhas:plan'

const MAX_HISTORY = 3
const PLANNER_CATEGORIES = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'] as const

const sanitizeStringList = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return []
  }
  const seen = new Set<string>()
  return values
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => {
      if (!entry) {
        return false
      }
      const key = entry.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

const coerceIntWithin = (value: unknown, fallback: number, min: number, max?: number): number => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }
  const rounded = Math.round(numeric)
  if (max === undefined) {
    return Math.max(min, rounded)
  }
  return Math.min(Math.max(min, rounded), max)
}

const generatePlannerId = (prefix: string, value: string): string => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  const fallback =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10)
  const identifier = normalized || fallback
  return `${prefix}-${identifier}`.slice(0, 80)
}

const AGE_BUCKET_LABELS: Record<AgeBucket, string> = {
  '0-6m': '0-6 meses',
  '7-12m': '7-12 meses',
  '1-2a': '1-2 anos',
  '3-4a': '3-4 anos',
  '5-6a': '5-6 anos',
}

const formatBudgetLabel = (value: RecipeBudget) => {
  switch (value) {
    case '$':
      return '$ (básico)'
    case '$$':
      return '$$ (intermediário)'
    case '$$$':
      return '$$$ (especial)'
    default:
      return value
  }
}

const planFromStorage = (fallback: PlanTier): PlanTier => {
  if (typeof window === 'undefined') {
    return fallback
  }
  const stored = window.localStorage.getItem(PLAN_STORAGE_KEY)
  if (stored === 'free' || stored === 'essencial' || stored === 'premium') {
    return stored
  }
  return fallback
}

type HistoryEntry = {
  id: string
  title: string
  summary: string
  badges: string[]
  viewedAt: number
  suggestion: RecipeSuggestion
}

type ReceitinhasCardProps = {
  childAgeMonths: number | null
  initialPlan: PlanTier
}

type ToastState = { message: string; type: 'success' | 'error' | 'info' }

type PlannerModalState = {
  open: boolean
  suggestion: RecipeSuggestion | null
}

const readHistory = (): HistoryEntry[] => {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as HistoryEntry[]
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch (error) {
    console.error('[Receitinhas] Failed to read history', error)
  }
  return []
}

const persistHistory = (entries: HistoryEntry[]) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('[Receitinhas] Failed to persist history', error)
  }
}

const readFavorites = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set()
  }
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) {
      return new Set()
    }
    const parsed = JSON.parse(raw) as string[]
    if (Array.isArray(parsed)) {
      return new Set(parsed)
    }
  } catch (error) {
    console.error('[Receitinhas] Failed to read favorites', error)
  }
  return new Set()
}

const persistFavorites = (favorites: Set<string>) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)))
  } catch (error) {
    console.error('[Receitinhas] Failed to persist favorites', error)
  }
}

const mergeShoppingList = (items: string[]) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    const raw = window.localStorage.getItem(SHOPPING_LIST_STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : []
    const normalized = new Set<string>(
      Array.isArray(current) ? (current as string[]).map((entry) => entry.trim()) : []
    )
    for (const item of items) {
      const normalizedItem = item.trim()
      if (normalizedItem) {
        normalized.add(normalizedItem)
      }
    }
    window.localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(Array.from(normalized)))
  } catch (error) {
    console.error('[Receitinhas] Failed to merge shopping list', error)
  }
}

const suggestionMatchesSearch = (suggestion: RecipeSuggestion, query: string) => {
  if (!query) {
    return true
  }
  const normalizedQuery = query.toLowerCase()
  return (
    suggestion.title.toLowerCase().includes(normalizedQuery) ||
    suggestion.summary.toLowerCase().includes(normalizedQuery)
  )
}

export function ReceitinhasCard({ childAgeMonths, initialPlan }: ReceitinhasCardProps) {
  const [ingredient, setIngredient] = useState('')
  const [category, setCategory] = useState<RecipeCategory>('refeicao')
  const [isCardHovering, setIsCardHovering] = useState(false)
  const [timeMax, setTimeMax] = useState<number | null>(null)
  const [equipment, setEquipment] = useState<string[]>([])
  const [diet, setDiet] = useState<string[]>([])
  const [energy, setEnergy] = useState<RecipeEnergy>('normal')
  const [servings, setServings] = useState(2)
  const [budget, setBudget] = useState<RecipeBudget>('$')
  const [plan, setPlan] = useState<PlanTier>(initialPlan)

  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([])
  const [aggregatedShoppingList, setAggregatedShoppingList] = useState<string[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [accessModal, setAccessModal] = useState<string | null>(null)
  const [detailSuggestion, setDetailSuggestion] = useState<RecipeSuggestion | null>(null)
  const [plannerModal, setPlannerModal] = useState<PlannerModalState>({ open: false, suggestion: null })
  const [plannerDate, setPlannerDate] = useState('')
  const [plannerTime, setPlannerTime] = useState('12:00')
  const [plannerCategory, setPlannerCategory] = useState<(typeof PLANNER_CATEGORIES)[number]>('Almoço')
  const [plannerSaving, setPlannerSaving] = useState(false)

  const [toast, setToast] = useState<ToastState | null>(null)

  const ageBucket = useMemo<AgeBucket>(() => mapMonthsToBucket(childAgeMonths), [childAgeMonths])
  const latestRequestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setPlan(planFromStorage(initialPlan))
    setHistory(readHistory())
    setFavorites(readFavorites())
  }, [initialPlan])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, plan)
    } catch (error) {
      console.error('[Receitinhas] Failed to persist plan selection', error)
    }
  }, [plan])

  const resetPlannerForm = useCallback((suggestion: RecipeSuggestion | null) => {
    const now = new Date()
    const dateISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setPlannerDate(dateISO)
    setPlannerTime('12:00')
    setPlannerCategory('Almoço')
    setPlannerModal({ open: true, suggestion })
  }, [])

  const dismissPlannerModal = () => {
    setPlannerModal({ open: false, suggestion: null })
  }

  const toggleEquipment = (value: string) => {
    setEquipment((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    )
  }

  const toggleDiet = (value: string) => {
    setDiet((previous) => (previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]))
  }

  const handleServingsChange = (direction: 'dec' | 'inc') => {
    setServings((previous) => {
      if (direction === 'dec') {
        return Math.max(1, previous - 1)
      }
      return Math.min(6, previous + 1)
    })
  }

  const handleFavoritesToggle = (suggestion: RecipeSuggestion) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(suggestion.id)) {
        next.delete(suggestion.id)
        persistFavorites(next)
        setToast({ message: 'Removido dos favoritos.', type: 'info' })
        return next
      }
      next.add(suggestion.id)
      persistFavorites(next)
      setToast({ message: 'Salvo nos favoritos 💖', type: 'success' })
      return next
    })
  }

  const persistHistoryEntry = useCallback((entry: RecipeSuggestion) => {
    setHistory((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== entry.id)
      const nextEntry: HistoryEntry = {
        id: entry.id,
        title: entry.title,
        summary: entry.summary,
        badges: entry.badges ?? [],
        viewedAt: Date.now(),
        suggestion: entry,
      }
      const combined = [nextEntry, ...withoutCurrent].slice(0, MAX_HISTORY)
      persistHistory(combined)
      return combined
    })
  }, [])

  const openDetail = (suggestion: RecipeSuggestion) => {
    setDetailSuggestion(suggestion)
    persistHistoryEntry(suggestion)
  }

  const closeDetail = () => {
    setDetailSuggestion(null)
  }

  const handleAddShoppingList = (suggestion: RecipeSuggestion) => {
    if (!suggestion.shopping_list || suggestion.shopping_list.length === 0) {
      setToast({ message: 'Nada para adicionar agora.', type: 'info' })
      return
    }
    mergeShoppingList(suggestion.shopping_list)
    setToast({ message: 'Lista de compras atualizada 🛒', type: 'success' })
  }

  const handleShare = async (suggestion: RecipeSuggestion) => {
    const shareText = `${suggestion.title} • ${suggestion.summary}`
    const shareData: ShareData = {
      title: suggestion.title,
      text: shareText,
      url: `https://materna360.app/receitas/${encodeURIComponent(suggestion.id)}`,
    }
    try {
      const nav =
        typeof window !== 'undefined'
          ? (window.navigator as Navigator & { clipboard?: Clipboard; share?: (data: ShareData) => Promise<void> })
          : undefined
      if (nav?.share) {
        await nav.share(shareData)
        return
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(`${shareText}\n${shareData.url}`)
        setToast({ message: 'Link copiado para compartilhar 💌', type: 'success' })
      }
    } catch (error) {
      console.error('[Receitinhas] Share failed', error)
      setToast({ message: 'Não foi possível compartilhar agora.', type: 'error' })
    }
  }

  const handlePlannerSave = async () => {
    if (!plannerModal.open || !plannerModal.suggestion) {
      return
    }
    if (!plannerDate || !plannerTime) {
      setToast({ message: 'Escolha data e horário.', type: 'error' })
      return
    }
    setPlannerSaving(true)
    const recipe = plannerModal.suggestion
    try {
      const shoppingList = sanitizeStringList(recipe.shopping_list)
      const readyInMinutes = coerceIntWithin(recipe.time_total_min, 20, 1, 240)
      const servings = coerceIntWithin(recipe.servings, 2, 1, 20)
      const recipePayload = {
        type: 'recipe' as const,
        id: recipe.id || generatePlannerId('recipe', recipe.title),
        title: recipe.title,
        readyInMinutes,
        servings,
        shoppingList,
      }

      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Receitinhas: ${recipe.title}`,
          dateISO: plannerDate,
          timeISO: plannerTime,
          category: plannerCategory,
          link: '#receitinhas',
          payload: recipePayload,
          tags: ['Receitinhas'],
        }),
      })
      if (!response.ok) {
        throw new Error('Planner response not ok')
      }
      setToast({ message: 'Receita salva no Planner ✨', type: 'success' })
      dismissPlannerModal()
    } catch (error) {
      console.error('[Receitinhas] Failed to save planner item', error)
      setToast({ message: 'Não deu pra salvar agora. Tente mais tarde.', type: 'error' })
    } finally {
      setPlannerSaving(false)
    }
  }

  const performGenerate = useCallback(
    async (payload: any) => {
      setIsLoading(true)
      setError(null)
      latestRequestRef.current?.abort()
      const controller = new AbortController()
      latestRequestRef.current = controller
      try {
        console.debug('recipes.generate', payload)
        const response = await fetch('/api/ai/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = (await response.json()) as RecipesApiResponse
        if (data.access.denied) {
          setAccessModal(
          data.access.message ||
            'Receitinhas faz parte dos planos pagos. Experimente o Essencial (1 receita/dia) ou o Premium (ilimitadas).'
        )
          setSuggestions([])
          setAggregatedShoppingList([])
          return
        }
        if (data.access.limited_to_one) {
          setToast({ message: 'No Essencial você vê 1 receita por dia.', type: 'info' })
        }
        const received = data.suggestions ?? []
        setSuggestions(received)
        setAggregatedShoppingList(data.aggregates?.consolidated_shopping_list ?? [])
        if (!received.length) {
          setError('Nenhuma sugestão desta vez. Que tal ajustar os filtros?')
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }
        console.error('[Receitinhas] Generate failed', error)
        setError('Não conseguimos gerar agora. Tente novamente em instantes.')
        setSuggestions([])
        setAggregatedShoppingList([])
        setToast({ message: 'Não foi possível gerar receitas agora.', type: 'error' })
        console.debug('recipes.generate.error', { payload, error })
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      ingredient: ingredient.trim(),
      category,
      filters: {
        time_max_minutes: timeMax,
        equipment,
        diet,
        energy,
        servings,
        budget,
      },
      child: {
        age_months: childAgeMonths ?? null,
        age_bucket: ageBucket,
      },
      plan,
      locale: 'pt-BR',
    }
    void performGenerate(payload)
  }

  const handleQuickIdeas = () => {
    const payload = {
      ingredient: '',
      category,
      filters: {
        time_max_minutes: null,
        equipment: [],
        diet: [],
        energy,
        servings,
        budget,
      },
      child: {
        age_months: childAgeMonths ?? null,
        age_bucket: ageBucket,
      },
      plan,
      locale: 'pt-BR',
    }
    void performGenerate(payload)
  }

  const filteredHistory = useMemo(
    () => history.filter((entry) => suggestionMatchesSearch(entry.suggestion, ingredient)).slice(0, MAX_HISTORY),
    [history, ingredient]
  )

  return (
    <section
      id="receitinhas"
      className={`ReceitinhasScope ReceitinhasParent CardElevate${isCardHovering ? ' CardElevate--hover is-forced-hover' : ''} rounded-3xl border border-white/70 bg-white px-6 py-7 backdrop-blur-sm md:px-8 md:py-9`}
      onMouseEnter={() => setIsCardHovering(true)}
      onMouseLeave={() => setIsCardHovering(false)}
    >
      <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
        <header className="space-y-3 md:space-y-4">
          <span className="eyebrow-capsule">Alimentação inteligente</span>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 text-xl">
                🧡
              </span>
              <div className="space-y-1.5">
                <h2 className="text-[20px] font-bold leading-[1.28] text-support-1 md:text-[22px]">Receitinhas</h2>
                <p className="text-sm leading-[1.45] text-support-2/85 md:text-base">Diga 1 ingrediente e eu preparo o resto.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickIdeas}
              className="inline-flex h-[32px] items-center justify-center rounded-full border border-primary/40 bg-white/80 px-4 text-[12px] font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            >
              Quero ideias rápidas
            </button>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <label className="flex-1">
              <span className="sr-only">Ingrediente principal</span>
              <input
                value={ingredient}
                onChange={(event) => setIngredient(event.target.value)}
                placeholder="Ex.: frango, abobrinha, banana…"
                aria-label="Informe um ingrediente"
                className="w-full rounded-2xl border border-neutral-200 bg-white/95 px-4 py-3 text-sm font-medium text-support-1 shadow-[inset_0_1px_8px_-4px_rgba(47,58,86,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                autoComplete="off"
                inputMode="text"
                id="receitinhas-ingredient"
              />
            </label>
          </div>
        </header>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">CATEGORIA</legend>
          <div className="flex flex-wrap gap-[6px]">
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = category === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  aria-pressed={isActive}
                  className={`${chipClasses(isActive)} gap-2`}
                >
                  <span className="mr-1" aria-hidden="true">
                    {option.icon}
                  </span>
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="grid gap-y-4 gap-x-3 lg:grid-cols-2 lg:gap-y-5 lg:gap-x-4">
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">TEMPO MÁXIMO</legend>
            <div className="flex flex-wrap gap-[6px]">
              {TIME_OPTIONS.map((value) => {
                const isActive = timeMax === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setTimeMax(isActive ? null : value)}
                    className={chipClasses(isActive)}
                  >
                    {value} min
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">EQUIPAMENTOS</legend>
            <div className="flex flex-wrap gap-[6px]">
              {EQUIPMENT_OPTIONS.map((option) => {
                const isActive = equipment.includes(option.value)
                return (
                  <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleEquipment(option.value)}
                  aria-pressed={isActive}
                  className={`${chipClasses(isActive)} capitalize`}
                >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">DIETA</legend>
            <div className="flex flex-wrap gap-[6px]">
              {DIET_OPTIONS.map((option) => {
                const isActive = diet.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDiet(option.value)}
                    aria-pressed={isActive}
                    className={chipClasses(isActive)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">ENERGIA</legend>
            <div className="flex flex-wrap gap-[6px]">
              {ENERGY_OPTIONS.map((option) => {
                const isActive = option.value === energy
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEnergy(option.value)}
                    aria-pressed={isActive}
                    className={chipClasses(isActive)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-2 shadow-[inset_0_1px_6px_-4px_rgba(47,58,86,0.18)]">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">PORÇÕES</span>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleServingsChange('dec')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                aria-label="Diminuir porções"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold text-support-1">{servings}</span>
              <button
                type="button"
                onClick={() => handleServingsChange('inc')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                aria-label="Aumentar porções"
              >
                +
              </button>
            </div>
          </div>

          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/70">ORÇAMENTO</legend>
            <div className="flex flex-wrap gap-[6px]">
              {BUDGET_OPTIONS.map((option) => {
                const isActive = option.value === budget
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudget(option.value)}
                    aria-pressed={isActive}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                      isActive
                        ? 'border-primary bg-primary text-white shadow-glow'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button type="submit" variant="primary" size="sm" className="h-9 rounded-full px-6 text-sm">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Já já sai do forno 🍲
              </span>
            ) : (
              'Gerar receita'
            )}
          </Button>
          <span className="text-xs text-support-2/70">Plano atual: {plan === 'premium' ? 'Premium' : plan === 'essencial' ? 'Essencial' : 'Gratuito'}</span>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {isLoading && (
          <div className="space-y-4" aria-live="polite">
            <p className="text-sm font-semibold text-support-2/80">Já já sai do forno 🍲</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="min-w-[240px] flex-1 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft"
                >
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-secondary/40" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-secondary/30" />
                  <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-secondary/20" />
                  <div className="mt-6 h-9 w-full animate-pulse rounded-full bg-secondary/20" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-support-2/20 bg-white/95 p-4 text-sm text-support-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={handleQuickIdeas}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-primary/40 bg-white/80 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Sugestões</h3>
              <span className="text-xs text-support-2/70">Toque para ver detalhes completos</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {suggestions.map((suggestion) => {
                const headlineBadge = suggestion.badges?.[0] ?? 'Receitinhas'
                return (
                  <article
                    key={suggestion.id}
                    className="min-h-[176px] min-w-[260px] flex-1 rounded-3xl border border-support-2/20 bg-white/97 p-5 shadow-[0_18px_44px_-26px_rgba(47,58,86,0.28)] transition-transform duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-[0_26px_56px_-24px_rgba(255,0,94,0.28)]"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      {formatBadgeLabel(headlineBadge)}
                    </div>
                    <h4 className="mt-3 text-lg font-semibold text-support-1">{suggestion.title}</h4>
                    <p className="mt-2 text-sm text-support-2/80 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
                      {suggestion.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-[6px] text-xs text-support-2/70">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/40 px-3 py-1 text-support-1">
                        <Timer className="h-3.5 w-3.5" aria-hidden="true" /> {suggestion.time_total_min} min
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/30 px-3 py-1 text-support-1">
                        <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" /> {formatBudgetLabel(suggestion.cost_tier)}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 rounded-full"
                        type="button"
                        onClick={() => openDetail(suggestion)}
                      >
                        Ver detalhes
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleFavoritesToggle(suggestion)}
                        aria-label={favorites.has(suggestion.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                          favorites.has(suggestion.id) ? 'bg-primary/10 text-primary' : 'bg-white text-primary'
                        }`}
                      >
                        {favorites.has(suggestion.id) ? <Heart className="h-4 w-4" /> : <HeartOff className="h-4 w-4" />}
                      </button>
                    </div>
                </article>
              )})}
            </div>
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Histórico</h3>
            </div>
            <div className="grid gap-y-4 gap-x-3 md:grid-cols-3 md:gap-y-5 md:gap-x-5 lg:gap-y-6 lg:gap-x-6">
              {filteredHistory.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openDetail(entry.suggestion)}
                  className="rounded-2xl border border-white/60 bg-white/85 p-4 text-left text-sm shadow-[0_18px_36px_-24px_rgba(47,58,86,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(255,0,94,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                >
                  <p className="font-semibold text-support-1">{entry.title}</p>
                  <p className="mt-1 text-xs text-support-2/80 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
                    {entry.summary}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && history.length === 0 && (
          <div className="rounded-2xl border border-support-2/20 bg-white/92 p-6 text-center text-sm text-support-2/80 shadow-[0_16px_32px_-24px_rgba(47,58,86,0.24)]">
            <p>Suas últimas receitas aparecem aqui.</p>
            <button
              type="button"
              onClick={handleQuickIdeas}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-primary/40 bg-white/80 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            >
              Quero ideias rápidas
            </button>
          </div>
        )}

        {!isLoading && aggregatedShoppingList.length > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <h4 className="text-sm font-semibold text-primary">Lista consolidada</h4>
            <ul className="mt-2 space-y-1 text-sm text-support-1">
              {aggregatedShoppingList.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {accessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 px-4"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-elevated">
            <button
              type="button"
              onClick={() => setAccessModal(null)}
              aria-label="Fechar"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-support-1 shadow transition hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-semibold text-support-1">Receitinhas</h3>
              <p className="text-sm text-support-2">{accessModal}</p>
              <Button
                variant="primary"
                size="sm"
                type="button"
                className="rounded-full"
                onClick={() => {
                  window.location.href = '/planos'
                }}
              >
                Conhecer planos
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailSuggestion && (
        <RecipeDetailModal
          suggestion={detailSuggestion}
          ageBucket={ageBucket}
          onClose={closeDetail}
          isFavorite={favorites.has(detailSuggestion.id)}
          onFavoriteToggle={() => handleFavoritesToggle(detailSuggestion)}
          onSavePlanner={() => resetPlannerForm(detailSuggestion)}
          onAddShoppingList={() => handleAddShoppingList(detailSuggestion)}
          onShare={() => void handleShare(detailSuggestion)}
          aggregatedShoppingList={aggregatedShoppingList}
        />
      )}

      {plannerModal.open && plannerModal.suggestion && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-elevated">
            <button
              type="button"
              onClick={dismissPlannerModal}
              aria-label="Fechar"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-support-1 shadow transition hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-5 pt-2">
              <header className="space-y-2">
                <h3 className="text-lg font-semibold text-support-1">Salvar no Planner</h3>
                <p className="text-sm text-support-2/80">{plannerModal.suggestion.title}</p>
              </header>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-support-1">
                  Data
                  <input
                    type="date"
                    value={plannerDate}
                    onChange={(event) => setPlannerDate(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-sm text-support-1 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                  />
                </label>
                <label className="block text-sm font-medium text-support-1">
                  Horário
                  <input
                    type="time"
                    value={plannerTime}
                    onChange={(event) => setPlannerTime(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-sm text-support-1 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                  />
                </label>
                <label className="block text-sm font-medium text-support-1">
                  Categoria
                  <select
                    value={plannerCategory}
                    onChange={(event) => setPlannerCategory(event.target.value as (typeof PLANNER_CATEGORIES)[number])}
                    className="mt-1 w-full rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-sm text-support-1 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                  >
                    {PLANNER_CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 rounded-full"
                  type="button"
                  onClick={() => void handlePlannerSave()}
                  disabled={plannerSaving}
                >
                  {plannerSaving ? 'Salvando…' : 'Salvar'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 rounded-full" type="button" onClick={dismissPlannerModal}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  )
}

type RecipeDetailModalProps = {
  suggestion: RecipeSuggestion
  ageBucket: AgeBucket
  onClose: () => void
  isFavorite: boolean
  onFavoriteToggle: () => void
  onSavePlanner: () => void
  onAddShoppingList: () => void
  onShare: () => void
  aggregatedShoppingList: string[]
}

function RecipeDetailModal({
  suggestion,
  ageBucket,
  onClose,
  isFavorite,
  onFavoriteToggle,
  onSavePlanner,
  onAddShoppingList,
  onShare,
  aggregatedShoppingList,
}: RecipeDetailModalProps) {
  const applicableAdaptation = suggestion.age_adaptations?.[ageBucket] ?? null
  const ageLabel = AGE_BUCKET_LABELS[ageBucket] ?? ageBucket

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1250] flex items-start justify-center overflow-y-auto bg-black/45 p-4 md:p-10">
      <div className="relative mt-10 w-full max-w-2xl rounded-3xl bg-white/98 p-6 shadow-elevated md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-support-1 shadow transition hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              {suggestion.badges?.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {formatBadgeLabel(badge)}
                </span>
              ))}
            </div>
            <h3 className="text-2xl font-semibold text-support-1">{suggestion.title}</h3>
            <p className="text-sm text-support-2/80">{suggestion.summary}</p>
            <div className="flex flex-wrap gap-3 text-xs text-support-2/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" /> {suggestion.time_total_min} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1">
                <ChefHat className="h-3.5 w-3.5" aria-hidden="true" /> {suggestion.effort}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/40 px-3 py-1">
                <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" /> {formatBudgetLabel(suggestion.cost_tier)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/30 px-3 py-1">
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" /> {suggestion.servings} porções
              </span>
            </div>
          </header>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Ingredientes</h4>
            <ul className="space-y-2 text-sm text-support-1/90">
              {suggestion.ingredients.map((ingredient) => (
                <li key={ingredient.item} className="rounded-2xl border border-white/70 bg-white/90 p-3">
                  <p className="font-semibold text-support-1">
                    {ingredient.qty ? `${ingredient.qty} ` : ''}
                    {ingredient.unit ? `${ingredient.unit} ` : ''}
                    {ingredient.item}
                    {ingredient.optional ? ' (opcional)' : ''}
                  </p>
                  {ingredient.notes && <p className="text-xs text-support-2/80">{ingredient.notes}</p>}
                  {ingredient.allergens && ingredient.allergens.length > 0 && (
                    <p className="mt-1 text-xs font-medium text-primary/80">Alérgenos: {ingredient.allergens.join(', ')}</p>
                  )}
                  {ingredient.subs && ingredient.subs.length > 0 && (
                    <p className="mt-1 text-xs text-support-2/80">Substituições: {ingredient.subs.join(' ou ')}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Modo de fazer</h4>
            <ol className="space-y-2 text-sm text-support-1/90">
              {suggestion.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-1 h-6 w-6 flex-shrink-0 rounded-full bg-primary/10 text-center text-xs font-semibold leading-6 text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {applicableAdaptation && (
            <section className="space-y-2 rounded-2xl bg-secondary/40 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Adaptações por idade</h4>
              <p className="text-xs font-semibold text-support-1/70">Para {ageLabel}</p>
              <p className="text-sm text-support-1/80">{applicableAdaptation}</p>
            </section>
          )}

          {suggestion.safety_notes && suggestion.safety_notes.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Notas de segurança</h4>
              <ul className="space-y-1.5 text-sm text-support-1/80">
                {suggestion.safety_notes.map((note) => (
                  <li key={note} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {suggestion.tips && suggestion.tips.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Dicas</h4>
              <ul className="space-y-1.5 text-sm text-support-1/80">
                {suggestion.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {suggestion.microcopy && (
            <p className="text-sm font-semibold text-primary/80">{suggestion.microcopy}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" className="flex-1 rounded-full" type="button" onClick={onSavePlanner}>
              Salvar no Planner
            </Button>
            <Button
              variant={isFavorite ? 'primary' : 'outline'}
              size="sm"
              className="flex-1 rounded-full inline-flex items-center justify-center gap-2"
              type="button"
              onClick={onFavoriteToggle}
              aria-pressed={isFavorite}
            >
              {isFavorite ? <Heart className="h-4 w-4" /> : <HeartOff className="h-4 w-4" />}
              Favoritar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full inline-flex items-center justify-center gap-2"
              type="button"
              onClick={onAddShoppingList}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Adicionar à lista de compras
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full inline-flex items-center justify-center gap-2"
              type="button"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Compartilhar
            </Button>
          </div>

          {aggregatedShoppingList.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/70">Lista consolidada</h4>
              <ul className="space-y-1.5 text-sm text-support-1/80">
                {aggregatedShoppingList.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
