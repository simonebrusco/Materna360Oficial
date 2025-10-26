'use client'

'use client'

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'

import {
  type HealthyRecipe,
  type RecipeCourseOption,
  type RecipeDietaryOption,
  type RecipeGenerationResponse,
  type RecipeTimeOption,
  BREASTFEEDING_MESSAGE,
  isUnderSixMonths,
  mapMonthsToRecipeBand,
  sanitizeIngredients,
} from '@/app/lib/healthyRecipes'
import { VALID_PLANNER_CATEGORIES } from '@/app/lib/plannerServer'
import type { PlannerItem } from '@/lib/plannerData'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'

const COURSE_OPTIONS: { value: RecipeCourseOption; label: string }[] = [
  { value: 'prato_quente', label: 'Pratos quentes' },
  { value: 'sopas_caldo', label: 'Sopas e caldos' },
  { value: 'saladas', label: 'Saladas' },
  { value: 'lanches_rapidos', label: 'Lanches rápidos' },
  { value: 'sobremesas', label: 'Sobremesas' },
  { value: 'sucos_smoothies', label: 'Sucos e smoothies' },
]

const DIETARY_OPTIONS: { value: RecipeDietaryOption; label: string }[] = [
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
  { value: 'sem_lactose', label: 'Sem lactose' },
  { value: 'sem_gluten', label: 'Sem glúten' },
  { value: 'sem_acucar_adicionado', label: 'Sem açúcar adicionado' },
]

const TIME_OPTIONS: { value: RecipeTimeOption; label: string }[] = [
  { value: '<=15', label: 'Até 15 min' },
  { value: '<=30', label: 'Até 30 min' },
  { value: '<=45', label: 'Até 45 min' },
  { value: '>45', label: 'Mais de 45 min' },
]

const AGE_BAND_LABEL: Record<string, string> = {
  '6-8m': '6–8 meses',
  '9-12m': '9–12 meses',
  '1-2y': '1–2 anos',
  '2-6y': '2–6 anos',
}

const QUICK_SUGGESTIONS = [
  {
    emoji: '🍠',
    title: 'Purê cremoso de batata-doce',
    prep: '15 min',
    description: 'Textura macia com toque de azeite e tomilho fresco.',
  },
  {
    emoji: '🥦',
    title: 'Brócolis ao vapor com ricota',
    prep: '12 min',
    description: 'Verdinhos no ponto, com ricota temperada e limão.',
  },
  {
    emoji: '🍓',
    title: 'Iogurte com frutas vermelhas',
    prep: '5 min',
    description: 'Iogurte natural com frutas amassadas e chia.',
  },
  {
    emoji: '🌽',
    title: 'Bolinho de milho de frigideira',
    prep: '18 min',
    description: 'Milho, aveia e ovo em mini panquequinhas macias.',
  },
]

const CATEGORY_OPTIONS = VALID_PLANNER_CATEGORIES

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

const resolveRecipeId = (candidate: unknown, title: string, prefix: string): string => {
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim()
  }
  return generatePlannerId(prefix, title)
}

type PlannerCategory = (typeof CATEGORY_OPTIONS)[number]

type ProfileChild = {
  id: string
  nome: string
  idadeMeses: number
  alergias: string[]
}

type ProfileResponse = {
  nomeMae: string
  filhos: ProfileChild[]
}

type PlannerModalState = {
  open: boolean
  recipe: HealthyRecipe | null
}

const formatIngredientsInput = (input: string) =>
  sanitizeIngredients(
    input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )

const formatWeekday = (dateISO: string) => {
  const [year, month, day] = dateISO.split('-').map(Number)
  if (!year || !month || !day) {
    return ''
  }
  const date = new Date()
  date.setFullYear(year, month - 1, day)
  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
  return formatter.format(date)
}

const formatTime = (timeISO: string) => timeISO.slice(0, 5)

export function HealthyRecipesSection() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientsInput, setIngredientsInput] = useState('')
  const [courses, setCourses] = useState<RecipeCourseOption[]>([])
  const [dietary, setDietary] = useState<RecipeDietaryOption[]>([])
  const [timeOption, setTimeOption] = useState<RecipeTimeOption | undefined>(undefined)
  const [servings, setServings] = useState(2)
  const [recipes, setRecipes] = useState<HealthyRecipe[]>([])
  const [educationalMessage, setEducationalMessage] = useState<string | null>(null)
  const [noResultMessage, setNoResultMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [plannerModal, setPlannerModal] = useState<PlannerModalState>({ open: false, recipe: null })
  const [plannerDate, setPlannerDate] = useState<string>('')
  const [plannerTime, setPlannerTime] = useState<string>('12:00')
  const [plannerCategory, setPlannerCategory] = useState<PlannerCategory>('Almoço')
  const [plannerNote, setPlannerNote] = useState<string>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    let active = true
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error('Falha ao carregar perfil')
        }
        const data = (await response.json()) as ProfileResponse
        if (!active) return
        const normalizedChildren = Array.isArray(data?.filhos) && data.filhos.length > 0 ? data.filhos : []
        setProfile({
          nomeMae: typeof data?.nomeMae === 'string' ? data.nomeMae : '',
          filhos: normalizedChildren.map((child) => ({
            id: child.id,
            nome: child.nome ?? '',
            idadeMeses: child.idadeMeses ?? 0,
            alergias: Array.isArray(child.alergias)
              ? child.alergias.map((item) => (typeof item === 'string' ? item : '')).filter(Boolean)
              : [],
          })),
        })
        if (normalizedChildren.length > 0) {
          setSelectedChildId(normalizedChildren[0].id)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setProfile(null)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [])

  const selectedChild = useMemo(() => {
    if (!profile?.filhos?.length) {
      return null
    }
    return profile.filhos.find((child) => child.id === selectedChildId) ?? profile.filhos[0]
  }, [profile, selectedChildId])

  const childAllergies = selectedChild?.alergias ?? []
  const childMonths = selectedChild ? selectedChild.idadeMeses : null
  const childAgeBand = childMonths === null ? '1-2y' : mapMonthsToRecipeBand(childMonths)
  const underSix = childMonths !== null && isUnderSixMonths(childMonths)

  useEffect(() => {
    if (!plannerModal.open) {
      return
    }
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setPlannerDate(today)
    setPlannerTime('12:00')
    if (plannerModal.recipe) {
      setPlannerCategory(plannerModal.recipe.planner.suggestedCategory)
    } else {
      setPlannerCategory('Almoço')
    }
    setPlannerNote('')
  }, [plannerModal])

  const handleAddIngredient = useCallback(
    (raw: string) => {
      const nextItems = formatIngredientsInput(raw)
      if (nextItems.length === 0) {
        setIngredientsInput('')
        return
      }

      setIngredients((current) => {
        const merged = [...current]
        nextItems.forEach((item) => {
          if (!merged.some((existing) => existing.toLocaleLowerCase('pt-BR') === item.toLocaleLowerCase('pt-BR'))) {
            merged.push(item)
          }
        })
        return merged.slice(0, 12)
      })
      setIngredientsInput('')
    },
    []
  )

  const handleIngredientKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      handleAddIngredient(ingredientsInput)
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients((current) => current.filter((_, idx) => idx !== index))
  }

  const toggleCourse = (value: RecipeCourseOption) => {
    setCourses((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

  const toggleDietary = (value: RecipeDietaryOption) => {
    setDietary((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

  const handleGenerate = async (variationOf?: string) => {
    setError(null)

    if (ingredients.length === 0) {
      setError('Adicione pelo menos um ingrediente para gerar receitas.')
      return
    }

    if (!selectedChild) {
      setError('Conclua o perfil no Eu360 para personalizar as receitas.')
      return
    }

    setIsLoading(true)
    setEducationalMessage(null)
    setNoResultMessage(null)

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          filters: {
            courses,
            dietary,
            time: timeOption,
          },
          servings,
          child: {
            months: selectedChild.idadeMeses,
            allergies: childAllergies,
          },
          variationOf: variationOf ?? null,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível gerar receitas.')
      }

      const payload = (await response.json()) as RecipeGenerationResponse
      setEducationalMessage(payload.educationalMessage)
      setNoResultMessage(payload.noResultMessage)
      setRecipes(payload.recipes)
      setHasGenerated(true)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao gerar receitas.')
    } finally {
      setIsLoading(false)
    }
  }

  const openPlannerModal = (recipe: HealthyRecipe) => {
    setPlannerModal({ open: true, recipe })
  }

  const closePlannerModal = () => {
    setPlannerModal({ open: false, recipe: null })
  }

  const handlePlannerSave = async () => {
    if (!plannerModal.recipe || !plannerDate || !plannerTime) {
      return
    }

    try {
      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Receita: ${plannerModal.recipe.title}`,
          dateISO: plannerDate,
          timeISO: plannerTime,
          category: plannerCategory,
          link: '#receitas-saudaveis',
          payload: {
            recipe: plannerModal.recipe,
            note: plannerNote,
          },
          tags: Array.from(
            new Set(['receita', 'alimentação', 'saudável', ...(plannerModal.recipe.planner.tags ?? [])])
          ),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível salvar no Planner.')
      }

      const { id } = (await response.json()) as { id: string }
      const item: PlannerItem = {
        id,
        type: 'Receita',
        title: `Receita: ${plannerModal.recipe.title}`,
        done: false,
        durationMin: undefined,
        ageBand: undefined,
        notes: plannerNote ? plannerNote.trim() : undefined,
        refId: undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      window.dispatchEvent(
        new CustomEvent('planner:item-added', {
          detail: {
            dateKey: plannerDate,
            item,
          },
        })
      )

      const weekday = formatWeekday(plannerDate)
      const time = formatTime(plannerTime)
      setToast({
        message: `Receita salva no Planner para ${weekday} às ${time}.`,
        type: 'success',
      })
      closePlannerModal()
    } catch (err) {
      console.error(err)
      setToast({
        message: err instanceof Error ? err.message : 'Erro ao salvar no Planner.',
        type: 'error',
      })
    }
  }

  const handleShare = async (recipe: HealthyRecipe) => {
    const text = `${recipe.title}\nPronto em ${recipe.readyInMinutes} min para ${recipe.servings} porções.`

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, text })
      } catch (error) {
        console.error('Compartilhamento cancelado ou indisponível:', error)
      }
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: 'Detalhes copiados para compartilhar!', type: 'info' })
    } catch (error) {
      console.error('Falha ao copiar para área de transferência:', error)
      setToast({ message: 'Não foi possível copiar o conteúdo.', type: 'error' })
    }
  }

  if (underSix) {
    return (
      <Reveal>
        <Card className="section-card space-y-4">
          <div className="flex items-start gap-4">
            <div className="text-3xl" aria-hidden="true">🤱</div>
            <div className="space-y-3">
              <div>
                <h2 className="section-title">Receitas Saudáveis</h2>
                <p className="section-subtitle max-w-2xl text-support-2">
                  Ideias práticas e equilibradas a partir dos ingredientes que você tem em casa.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary shadow-soft">
                {BREASTFEEDING_MESSAGE}
              </div>
              <p className="text-xs text-support-2">
                Atualize a idade do bebê no Eu360 para liberar sugestões quando a introdução alimentar for indicada.
              </p>
            </div>
          </div>
        </Card>
      </Reveal>
    )
  }

  return (
    <section id="receitas-saudaveis" className="space-y-6">
      <Reveal>
        <Card className="section-card space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="section-title">Receitas Saudáveis</h2>
              <p className="section-subtitle max-w-2xl text-support-2">
                Ideias práticas e equilibradas a partir dos ingredientes que você tem em casa.
              </p>
            </div>

            {profile?.filhos?.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                    Escolha o filho para personalizar
                  </label>
                  <select
                    value={selectedChild?.id ?? ''}
                    onChange={(event) => setSelectedChildId(event.target.value)}
                    className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {profile.filhos.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.nome ? `${child.nome} — ${child.idadeMeses} meses` : `${child.idadeMeses} meses`}
                      </option>
                    ))}
                  </select>
                  {childAllergies.length > 0 && (
                    <p className="text-xs text-support-2">
                      Alergias registradas: {childAllergies.join(', ')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                    Porções
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={servings}
                    onChange={(event) => setServings(Math.min(Math.max(Number(event.target.value) || 1, 1), 6))}
                    className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-support-2">Faixa etária sugerida: {AGE_BAND_LABEL[childAgeBand]}</p>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
                Complete o perfil no Eu360 para receber receitas personalizadas.
              </p>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                  Ingredientes (pressione Enter para adicionar)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((item, index) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold text-support-1 shadow-soft"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="text-xs font-semibold text-primary/80 hover:text-primary"
                        aria-label={`Remover ingrediente ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={ingredientsInput}
                  onChange={(event) => setIngredientsInput(event.target.value)}
                  onKeyDown={handleIngredientKeyDown}
                  onBlur={() => ingredientsInput && handleAddIngredient(ingredientsInput)}
                  placeholder="Ex.: banana, aveia, cenoura"
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">Tipo de prato</p>
                  <div className="flex flex-wrap gap-2">
                    {COURSE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleCourse(option.value)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold shadow-soft transition-all duration-300 ${
                          courses.includes(option.value)
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-white/80 text-support-1 hover:bg-primary/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">Opções alimentares</p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleDietary(option.value)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold shadow-soft transition-all duration-300 ${
                          dietary.includes(option.value)
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-white/80 text-support-1 hover:bg-primary/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">Tempo de preparo</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeOption(timeOption === option.value ? undefined : option.value)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold shadow-soft transition-all duration-300 ${
                          timeOption === option.value
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-white/80 text-support-1 hover:bg-primary/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="rounded-2xl bg-primary/10 px-4 py-3 text-xs font-semibold text-primary">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => handleGenerate()} disabled={isLoading}>
                {isLoading ? 'Gerando receitas...' : 'Gerar receitas' }
              </Button>
              <p className="text-xs text-support-2">
                Máximo de 3 receitas por vez • Resultados personalizados para {AGE_BAND_LABEL[childAgeBand]}
              </p>
            </div>
          </div>
        </Card>
      </Reveal>

      {educationalMessage && (
        <Reveal>
          <Card className="section-card border border-primary/20 bg-primary/5 text-sm text-primary">
            {educationalMessage}
          </Card>
        </Reveal>
      )}

      {noResultMessage && (
        <Reveal>
          <Card className="section-card border border-secondary/50 bg-secondary/80 text-sm text-support-1">
            {noResultMessage}
          </Card>
        </Reveal>
      )}

      {recipes.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {recipes.map((recipe) => (
            <Reveal key={recipe.title}>
              <Card className="section-card flex h-full flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-support-1">{recipe.title}</h3>
                    <p className="mt-1 text-xs text-support-2">
                      Pronto em {recipe.readyInMinutes} min • {recipe.servings} porções • Adequado para {AGE_BAND_LABEL[recipe.ageBand] ?? recipe.ageBand}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-support-1">Por que é adequada</h4>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-support-2">
                      {recipe.rationale.map((item, index) => (
                        <li key={`${recipe.title}-rationale-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-support-1">Ingredientes</h4>
                    <ul className="space-y-1 text-sm text-support-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={`${recipe.title}-ingredient-${index}`} className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                          <span>
                            <span className="font-medium text-support-1">{ingredient.name}</span>
                            {ingredient.quantity ? ` — ${ingredient.quantity}` : ''}
                            {ingredient.providedByUser && <span className="ml-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">da sua lista</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-support-1">Passos</h4>
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-support-2">
                      {recipe.steps.map((step, index) => (
                        <li key={`${recipe.title}-step-${index}`}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {recipe.textureNote && (
                    <div className="rounded-2xl bg-secondary/60 p-3 text-xs text-support-1">
                      <span className="font-semibold">Textura segura:</span> {recipe.textureNote}
                    </div>
                  )}

                  {recipe.safetyNotes && recipe.safetyNotes.length > 0 && (
                    <div className="space-y-1 text-xs text-primary">
                      <p className="font-semibold">Observações de segurança</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {recipe.safetyNotes.map((note, index) => (
                          <li key={`${recipe.title}-safety-${index}`}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recipe.nutritionBadge && recipe.nutritionBadge.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recipe.nutritionBadge.map((badge) => (
                        <span
                          key={`${recipe.title}-badge-${badge}`}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => openPlannerModal(recipe)}>
                    Salvar no Planner
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleGenerate(recipe.title)}
                    disabled={isLoading}
                  >
                    Gerar variação
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShare(recipe)}>
                    Compartilhar
                  </Button>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {recipes.length === 0 && !hasGenerated && (
        <Reveal>
        <Card className="section-card">
          <h3 className="text-base font-semibold text-support-1">Sugestões rápidas de hoje</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {QUICK_SUGGESTIONS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-soft">
                  <div className="text-3xl">{item.emoji}</div>
                  <h4 className="mt-2 text-sm font-semibold text-support-1">{item.title}</h4>
                  <p className="mt-1 text-xs text-support-2">⏱️ {item.prep}</p>
                  <p className="mt-2 text-xs text-support-2">{item.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      )}

      {plannerModal.open && plannerModal.recipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-10 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-support-1">Salvar no Planner</h3>
                <p className="mt-1 text-xs text-support-2">
                  Defina quando você quer preparar “{plannerModal.recipe.title}”.
                </p>
              </div>
              <button
                type="button"
                onClick={closePlannerModal}
                className="text-sm font-semibold text-primary hover:text-primary/80"
                aria-label="Fechar modal de salvar no Planner"
              >
                Fechar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                  Data
                </label>
                <input
                  type="date"
                  value={plannerDate}
                  onChange={(event) => setPlannerDate(event.target.value)}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                  Horário
                </label>
                <input
                  type="time"
                  value={plannerTime}
                  onChange={(event) => setPlannerTime(event.target.value)}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPlannerCategory(option)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold shadow-soft transition-all duration-300 ${
                        plannerCategory === option
                          ? 'bg-primary text-white shadow-glow'
                          : 'bg-white/80 text-support-1 hover:bg-primary/10'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                  Observações (opcional)
                </label>
                <textarea
                  value={plannerNote}
                  onChange={(event) => setPlannerNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ex.: preparar sem mel, servir com frutas frescas"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closePlannerModal}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handlePlannerSave}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3500}
        />
      )}
    </section>
  )
}
