'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import PageTemplate from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import { toast } from '@/app/lib/toast'
import { useRotinaAISuggestions } from '@/app/hooks/useRotinaAISuggestions'
import { usePrimaryChildAge } from '@/app/hooks/usePrimaryChildAge'
import { updateXP } from '@/app/lib/xp'
import type { RotinaLeveContext } from '@/app/lib/ai/rotinaLeve'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'

type QuickIdea = {
  id: string
  text: string
}

type GeneratedRecipe = {
  id: string
  title: string
  description: string
  timeLabel: string
  ageLabel: string
  preparation: string
}

type Inspiration = {
  phrase: string
  care: string
  ritual: string
}

// ---------- MOCKS (fallback padrão) ----------

function mockGenerateIdeas(): Promise<QuickIdea[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'idea-1',
          text: 'Mini brincadeira sensorial com objetos que você já tem na sala.',
        },
        {
          id: 'idea-2',
          text: 'Conexão de 5 minutos: conte algo bom do seu dia para o seu filho.',
        },
        {
          id: 'idea-3',
          text: 'Um pequeno ritual de pausa juntas antes de retomar as tarefas.',
        },
      ])
    }, 800)
  })
}

function mockGenerateRecipes(): Promise<GeneratedRecipe[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'recipe-1',
          title: 'Creminho de aveia rápida',
          description:
            'Aveia, leite ou bebida vegetal e fruta amassada. Ideal para manhãs corridas.',
          timeLabel: 'Pronto em ~10 min',
          ageLabel: 'a partir de 1 ano',
          preparation:
            '1. Cozinhe 3 colheres de sopa de aveia em fogo baixo com 150ml de leite (ou bebida vegetal) por 5 minutos, mexendo ocasionalmente.\n2. Amasse uma fruta à sua escolha (maçã, banana, pera) em um prato à parte.\n3. Misture a aveia cozida com a fruta amassada.\n4. Deixe esfriar um pouco antes de servir.\n5. Você pode adicionar uma colher de mel ou melado se desejar mais doçura (após 1 ano).',
        },
        {
          id: 'recipe-2',
          title: 'Banana amassada com chia',
          description: 'Combinação simples para lanches rápidos e nutritivos.',
          timeLabel: 'Pronto em ~5 min',
          ageLabel: 'a partir de 6 meses',
          preparation:
            '1. Escolha uma banana bem madura e descasque-a.\n2. Amasse a banana em um prato com um garfo até obter uma consistência cremosa.\n3. Adicione 1 colher de chá de sementes de chia (se o bebê já tiver 8+ meses).\n4. Misture bem os ingredientes.\n5. Sirva imediatamente para evitar oxidação. Para bebês menores de 8 meses, omita a chia ou ofereça apenas a banana amassada.',
        },
        {
          id: 'recipe-3',
          title: 'Batida de iogurte com fruta',
          description: 'Uma opção refrescante e probiótica para o seu filho.',
          timeLabel: 'Pronto em ~3 min',
          ageLabel: 'a partir de 9 meses',
          preparation:
            '1. Coloque 100ml de iogurte natural integral em um copo.\n2. Adicione uma porção de fruta fresca (morango, mirtilo ou goiaba).\n3. Se preferir uma textura mais batida, use um garfo ou liquidificador por alguns segundos.\n4. Sirva em seguida. Dica: você pode congelar a fruta antes para deixar a bebida bem gelada e refrescante no calor.',
        },
      ])
    }, 900)
  })
}

function mockGenerateInspiration(): Promise<Inspiration> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        phrase: 'Você não precisa dar conta de tudo hoje.',
        care: '1 minuto de respiração consciente antes de retomar a próxima tarefa.',
        ritual: 'Envie uma mensagem carinhosa para alguém que te apoia.',
      })
    }, 700)
  })
}

// ---------- motor de receitas com fallback suave (via /api/ai/rotina-leve) ----------

async function generateRecipesWithAI(
  context: RotinaLeveContext,
  prompt?: string,
): Promise<GeneratedRecipe[]> {
  try {
    const body: any = { context }
    if (prompt && prompt.trim().length > 0) {
      body.prompt = prompt
    }

    const res = await fetch('/api/ai/rotina-leve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error('Resposta inválida')
    }

    const data = await res.json()
    const suggestions = data?.suggestions

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Nenhuma sugestão recebida')
    }

    const recipes: GeneratedRecipe[] = suggestions
      .filter((s: any) => s.category === 'receita-inteligente')
      .map((s: any, index: number) => ({
        id: s.id || `recipe-${index}`,
        title: s.title || 'Sugestão de receita rápida',
        description:
          s.description ||
          'Uma sugestão simples para um lanche rápido que cabe no seu dia.',
        timeLabel: s.timeLabel || 'Tempo flexível',
        ageLabel:
          s.ageLabel ||
          'Idade a partir de 6 meses (sempre respeitando orientação do pediatra).',
        preparation:
          s.preparation ||
          'Adapte esta sugestão aos ingredientes que você tem em casa e à fase do seu filho, sempre seguindo as orientações do pediatra.',
      }))

    if (recipes.length === 0) {
      throw new Error('Nenhuma receita categorizada recebida')
    }

    return recipes
  } catch (error) {
    console.error(
      '[Rotina Leve] Erro ao buscar receitas, usando fallback:',
      error,
    )
    toast.info('Trouxemos algumas sugestões de receitinhas rápidas pra hoje ✨')
    return await mockGenerateRecipes()
  }
}

// ---------- inspiração diária com fallback suave ----------

async function generateInspirationWithAI(focus: string | null): Promise<Inspiration> {
  try {
    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'daily_inspiration',
        origin: 'rotina-leve',
        focus: focus || null,
      }),
    })

    if (!res.ok) {
      throw new Error('Resposta inválida')
    }

    const data = await res.json()
    const inspiration = data?.inspiration

    if (!inspiration || typeof inspiration !== 'object') {
      throw new Error('Inspiração vazia')
    }

    return {
      phrase: inspiration.phrase ?? 'Você não precisa dar conta de tudo hoje.',
      care:
        inspiration.care ??
        '1 minuto de respiração consciente antes de retomar a próxima tarefa.',
      ritual:
        inspiration.ritual ??
        'Envie uma mensagem carinhosa para alguém que te apoia.',
    }
  } catch (error) {
    console.error('[Rotina Leve] Erro ao buscar inspiração, usando fallback:', error)
    toast.info('Preparei uma inspiração especial pra hoje ✨')
    return await mockGenerateInspiration()
  }
}

export default function RotinaLevePage() {
  const searchParams = useSearchParams()
  const abrir = searchParams?.get('abrir') ?? undefined

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const recipesUsageKey = useMemo(
    () => `rotina-leve:recipes:${currentDateKey}:count`,
    [currentDateKey],
  )

  const [openIdeas, setOpenIdeas] = useState(false)
  const [openInspiration, setOpenInspiration] = useState(false)

  // Receitas Inteligentes
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipes, setRecipes] = useState<GeneratedRecipe[] | null>(null)
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)

  // Controles de formulário de Receitas Inteligentes
  const [recipeIngredient, setRecipeIngredient] = useState('')
  const [recipeMealType, setRecipeMealType] = useState<string | null>(null)
  const [recipeTime, setRecipeTime] = useState<string | null>(null)

  // Limite diário real para Receitas Inteligentes
  const DAILY_RECIPE_LIMIT = 3
  const [usedRecipesToday, setUsedRecipesToday] = useState(0)

  // Ideias Rápidas
  const [ideas, setIdeas] = useState<QuickIdea[] | null>(null)

  // Ideias Rápidas - Filtros
  const [tempoDisponivel, setTempoDisponivel] = useState<string | null>(null)
  const [comQuem, setComQuem] = useState<string | null>(null)
  const [tipoIdeia, setTipoIdeia] = useState<string | null>(null)

  // Inspirações do Dia
  const [inspirationLoading, setInspirationLoading] = useState(false)
  const [inspiration, setInspiration] = useState<Inspiration | null>(null)
  const [focusOfDay, setFocusOfDay] = useState<string>('Cansaço')

  // Idade principal do filho (Eu360)
  const { ageMonths } = usePrimaryChildAge()
  const isBabyUnderSixMonths = ageMonths !== null && ageMonths < 6

  const {
    suggestions: aiSuggestions,
    isLoading: ideasLoading,
    requestSuggestions,
  } = useRotinaAISuggestions()

  const { addItem, getByOrigin } = usePlannerSavedContents()

  // Dados agregados do Planner para este mini-hub
  const plannerItemsFromRotinaLeve = getByOrigin('rotina-leve')
  const savedRecipesCount = plannerItemsFromRotinaLeve.filter(
    (item) => item.type === 'recipe',
  ).length
  const savedInsights = plannerItemsFromRotinaLeve.filter(
    (item) => item.type === 'insight',
  )
  const savedInspirationCount = savedInsights.length
  const lastInspiration = savedInsights[savedInsights.length - 1]

  // Quando o motor de Rotina retornar sugestões, convertemos para QuickIdea
  useEffect(() => {
    if (!aiSuggestions || aiSuggestions.length === 0) return

    const quickIdeas: QuickIdea[] = aiSuggestions
      .filter((s) => s.category === 'ideia-rapida')
      .map((s, index) => ({
        id: s.id || `ai-idea-${index}`,
        text: s.description || s.title,
      }))

    if (quickIdeas.length > 0) {
      setIdeas(quickIdeas)
    }
  }, [aiSuggestions])

  // Carregar uso de receitas do dia (limite diário persistente)
  useEffect(() => {
    const stored = load(recipesUsageKey)
    if (typeof stored === 'number') {
      setUsedRecipesToday(stored)
    } else if (typeof stored === 'string') {
      const parsed = parseInt(stored, 10)
      if (!Number.isNaN(parsed)) {
        setUsedRecipesToday(parsed)
      }
    }
  }, [recipesUsageKey])

  // Scroll vindo do hub (?abrir=...)
  useEffect(() => {
    if (!abrir || typeof window === 'undefined') return

    const options: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    }

    if (abrir === 'receitas') {
      document.getElementById('rotina-leve-receitas')?.scrollIntoView(options)
    }

    if (abrir === 'ideias') {
      setOpenIdeas(true)
      document.getElementById('rotina-leve-ideias')?.scrollIntoView(options)
    }

    if (abrir === 'inspiracoes') {
      setOpenInspiration(true)
      document.getElementById('rotina-leve-inspiracoes')?.scrollIntoView(options)
    }

    if (abrir === 'planejar') {
      document.getElementById('rotina-leve-planner')?.scrollIntoView(options)
    }
  }, [abrir])

  const handleSaveIdeia = () => {
    try {
      const ideasToSave =
        ideas && ideas.length > 0
          ? ideas.map((idea) => idea.text)
          : [
              'Mini brincadeira sensorial com objetos da sala.',
              'Conexão de 5 minutos: conte algo bom do seu dia para o seu filho.',
              'Ritual rápido: uma pausa tranquila juntas antes de recomeçar.',
            ]

      addItem({
        origin: 'rotina-leve',
        type: 'insight',
        title: 'Ideias rápidas para agora',
        payload: {
          ideas: ideasToSave,
        },
      })

      try {
        void updateXP(5)
      } catch (e) {
        console.error('[Rotina Leve] Erro ao atualizar XP (ideias):', e)
      }

      toast.success('Ideias salvas no planner 💗')
    } catch (error) {
      console.error('[Rotina Leve] Error saving ideas:', error)
      toast.danger('Não foi possível salvar as ideias agora.')
    }
  }

  const handleSaveRecipe = (recipe: GeneratedRecipe) => {
    try {
      addItem({
        origin: 'rotina-leve',
        type: 'recipe',
        title: recipe.title,
        payload: {
          description: recipe.description,
          timeLabel: recipe.timeLabel,
          ageLabel: recipe.ageLabel,
          preparation: recipe.preparation,
        },
      })

      // atualiza contador + persiste
      setUsedRecipesToday((prev) => {
        const next = prev + 1
        save(recipesUsageKey, next)
        return next
      })

      try {
        void updateXP(8)
      } catch (e) {
        console.error('[Rotina Leve] Erro ao atualizar XP (receita):', e)
      }

      toast.success('Receita salva no planner ✨')
    } catch (error) {
      console.error('[Rotina Leve] Error saving recipe:', error)
      toast.danger('Não foi possível salvar a receita agora.')
    }
  }

  const handleSaveInspiracao = () => {
    try {
      addItem({
        origin: 'rotina-leve',
        type: 'insight',
        title: 'Inspiração do dia',
        payload: {
          frase: inspiration?.phrase || 'Você não precisa dar conta de tudo hoje.',
          pequenoCuidado:
            inspiration?.care ||
            '1 minuto de respiração consciente antes de retomar a próxima tarefa.',
          miniRitual:
            inspiration?.ritual ||
            'Envie uma mensagem carinhosa para alguém que te apoia.',
        },
      })

      try {
        void updateXP(5)
      } catch (e) {
        console.error('[Rotina Leve] Erro ao atualizar XP (inspiração):', e)
      }

      toast.success('Inspiração salva no planner 💗')
    } catch (error) {
      console.error('[Rotina Leve] Error saving inspiration:', error)
      toast.danger('Não foi possível salvar a inspiração agora.')
    }
  }

  const handleGenerateRecipes = async () => {
    if (isBabyUnderSixMonths) {
      toast.info(
        'Até os 6 meses, a recomendação principal é o aleitamento materno exclusivo. Sempre siga a orientação do pediatra.',
      )
      return
    }

    if (usedRecipesToday >= DAILY_RECIPE_LIMIT) {
      toast.info(
        'Hoje você já pediu 3 receitas inteligentes. Amanhã a gente pensa em novas ideias com calma, combinado? 💗',
      )
      return
    }

    // Deriva minutos disponíveis a partir do TEMPO DE PREPARO da receita
    const recipeAvailableMinutes =
      recipeTime === '10'
        ? 10
        : recipeTime === '20'
        ? 20
        : recipeTime === '30'
        ? 30
        : recipeTime === '40+'
        ? 40
        : undefined

    // Define se a criança está por perto com base em "comQuem" (quando já tiver sido usado)
    const hasKidsAround =
      comQuem === 'familia-toda' || comQuem === 'eu-e-meu-filho'
        ? true
        : comQuem === 'so-eu'
        ? false
        : undefined

    const context: RotinaLeveContext = {
      mood: 'cansada',
      energy: 'baixa',
      timeOfDay: 'hoje',
      hasKidsAround,
      availableMinutes: recipeAvailableMinutes,
    }

    // Prompt contextual baseado nos campos do formulário + idade
    const promptParts: string[] = []

    if (recipeIngredient.trim().length > 0) {
      promptParts.push(`Ingrediente principal: ${recipeIngredient.trim()}.`)
    }

    if (recipeMealType) {
      const tipo =
        recipeMealType === 'lanche'
          ? 'lanche rápido'
          : recipeMealType === 'almoco-jantar'
          ? 'refeição principal (almoço ou jantar)'
          : recipeMealType === 'cafe-manha'
          ? 'café da manhã prático'
          : 'sobremesa leve'

      promptParts.push(`Tipo de refeição desejado: ${tipo}.`)
    }

    if (recipeTime) {
      promptParts.push(`Tempo de preparo preferido: cerca de ${recipeTime} minutos.`)
    }

    if (ageMonths !== null) {
      const idadeDescricao =
        ageMonths < 12
          ? `${ageMonths} meses`
          : `${Math.floor(ageMonths / 12)} ano(s) aproximadamente`

      promptParts.push(`Idade aproximada do filho: ${idadeDescricao}.`)
    }

    if (comQuem === 'familia-toda') {
      promptParts.push('A ideia é algo que funcione bem para a família toda.')
    } else if (comQuem === 'eu-e-meu-filho') {
      promptParts.push('A ideia é algo para mãe e filho fazerem juntos.')
    } else if (comQuem === 'so-eu') {
      promptParts.push(
        'Se fizer sentido, as sugestões podem ser simples para a mãe preparar sozinha.',
      )
    }

    const prompt =
      promptParts.length > 0
        ? promptParts.join(' ') +
          ' Gere até 3 sugestões de receitas simples, práticas e acolhedoras, sempre respeitando as orientações pediátricas para a idade.'
        : undefined

    setRecipesLoading(true)
    try {
      const result = await generateRecipesWithAI(context, prompt)
      setRecipes(result)
      // Futuro: aqui é um ótimo ponto pra telemetria *.generated
    } finally {
      setRecipesLoading(false)
    }
  }

  const handleGenerateIdeas = async () => {
    await requestSuggestions({
      mood: 'cansada',
      energy: 'baixa',
      timeOfDay: 'hoje',
      hasKidsAround:
        comQuem === 'familia-toda' || comQuem === 'eu-e-meu-filho'
          ? true
          : comQuem === 'so-eu'
          ? false
          : undefined,
      availableMinutes:
        tempoDisponivel === '5'
          ? 5
          : tempoDisponivel === '10'
          ? 10
          : tempoDisponivel === '20'
          ? 20
          : tempoDisponivel === '30+'
          ? 30
          : undefined,
      comQuem: comQuem as any,
      tipoIdeia: tipoIdeia as any,
    })
  }

  const handleGenerateInspiration = async () => {
    setInspirationLoading(true)
    try {
      const result = await generateInspirationWithAI(focusOfDay)
      setInspiration(result)
    } finally {
      setInspirationLoading(false)
    }
  }

  const hasRecipes = recipes && recipes.length > 0
  const isOverLimit = usedRecipesToday >= DAILY_RECIPE_LIMIT

  const idadeLabel =
    ageMonths === null
      ? 'idade não cadastrada'
      : ageMonths < 12
      ? `${ageMonths} meses`
      : `${Math.floor(ageMonths / 12)} ano(s)`

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <ClientOnly>
        {/* IMPORTANTE: sem mx-auto / max-w aqui, o PageTemplate já cuida disso */}
        <div className="pt-6 pb-10 space-y-8">
          <div className="space-y-6">
            {/* HERO CARD: Receitas Inteligentes */}
            <SoftCard
              id="rotina-leve-receitas"
              className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            >
              <div className="space-y-6 flex flex-col">
                <div className="space-y-1 pb-2">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                    Receitas Inteligentes
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                    Você diz o ingrediente, o Materna360 te ajuda com o resto.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-[#2f3a56]">Ingrediente principal</p>
                    <input
                      type="text"
                      placeholder="Ex.: banana, aveia, frango..."
                      value={recipeIngredient}
                      onChange={(e) => setRecipeIngredient(e.target.value)}
                      className="w-full rounded-2xl border border-[#ffd8e6] px-3 py-2 text-xs text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-[#2f3a56]">Tipo de refeição</p>
                      <select
                        value={recipeMealType ?? ''}
                        onChange={(e) =>
                          setRecipeMealType(e.target.value === '' ? null : e.target.value)
                        }
                        className="w-full rounded-2xl border border-[#ffd8e6] px-3 py-2 text-xs text-[#2f3a56] focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                      >
                        <option value="">Selecione</option>
                        <option value="lanche">Lanche</option>
                        <option value="almoco-jantar">Almoço / Jantar</option>
                        <option value="cafe-manha">Café da manhã</option>
                        <option value="sobremesa">Sobremesa leve</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-[#2f3a56]">Tempo de preparo</p>
                      <select
                        value={recipeTime ?? ''}
                        onChange={(e) =>
                          setRecipeTime(e.target.value === '' ? null : e.target.value)
                        }
                        className="w-full rounded-2xl border border-[#ffd8e6] px-3 py-2 text-xs text-[#2f3a56] focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                      >
                        <option value="">Selecione</option>
                        <option value="10">10 min</option>
                        <option value="20">20 min</option>
                        <option value="30">30 min</option>
                        <option value="40+">40+ min</option>
                      </select>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#ffd8e6]/20 px-3 py-1 text-[11px] text-[#ff005e]">
                    <span>Idade principal: {idadeLabel}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#545454]">
                  Para bebês menores de 6 meses, o ideal é manter o aleitamento materno e seguir
                  sempre a orientação do pediatra.
                </p>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateRecipes}
                    disabled={recipesLoading || isBabyUnderSixMonths}
                    className="w-full"
                  >
                    {recipesLoading ? 'Gerando receitas…' : 'Gerar receitas'}
                  </Button>

                  <p className="text-[11px] text-[#545454]">
                    Hoje você já usou{' '}
                    <span className="font-semibold text-[#2f3a56]">
                      {usedRecipesToday} de {DAILY_RECIPE_LIMIT}
                    </span>{' '}
                    sugestões do seu plano.
                  </p>

                  {isOverLimit && (
                    <p className="text-[11px] text-[#ff005e] font-medium">
                      Você chegou ao limite de receitas inteligentes do seu plano hoje. Amanhã tem
                      mais 💗
                    </p>
                  )}

                  {isBabyUnderSixMonths && (
                    <p className="text-[11px] text-[#ff005e] font-medium">
                      Como o seu bebê tem menos de 6 meses, o foco agora é o aleitamento materno
                      exclusivo. As receitinhas serão liberadas mais pra frente, sempre respeitando
                      a orientação do pediatra.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {recipesLoading && (
                    <div className="rounded-2xl bg-[#ffd8e6]/10 p-3">
                      <p className="text-[11px] text-[#545454]">
                        Estou pensando nas melhores opções pra hoje…
                      </p>
                    </div>
                  )}

                  {!recipesLoading && hasRecipes && !isBabyUnderSixMonths && (
                    <>
                      <p className="text-xs font-medium text-[#2f3a56]">
                        Sugestões de hoje (até 3)
                      </p>
                      <div className="space-y-3">
                        {recipes!.slice(0, 3).map((recipe) => {
                          const canSave = hasRecipes && !isOverLimit

                          return (
                            <div
                              key={recipe.id}
                              className="rounded-2xl bg-white border border-[#ffd8e6] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
                            >
                              <div
                                className="p-4 cursor-pointer hover:bg-[#ffd8e6]/5 transition-colors"
                                onClick={() =>
                                  setExpandedRecipeId(
                                    expandedRecipeId === recipe.id ? null : recipe.id,
                                  )
                                }
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-[#2f3a56]">
                                      {recipe.title}
                                    </h4>
                                    <p className="text-xs text-[#545454] mt-1 line-clamp-2">
                                      {recipe.description}
                                    </p>
                                    <p className="text-[10px] text-[#545454] mt-1.5">
                                      {recipe.timeLabel} · {recipe.ageLabel}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedRecipeId(
                                        expandedRecipeId === recipe.id ? null : recipe.id,
                                      )
                                    }}
                                    className="text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors whitespace-nowrap flex-shrink-0 pt-0.5"
                                  >
                                    {expandedRecipeId === recipe.id
                                      ? 'Ver menos ↑'
                                      : 'Ver detalhes →'}
                                  </button>
                                </div>
                              </div>

                              {expandedRecipeId === recipe.id && (
                                <div className="border-t border-[#ffd8e6] bg-[#ffd8e6]/5 p-4 space-y-3">
                                  <div>
                                    <h5 className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                                      Modo de preparo
                                    </h5>
                                    <p className="text-xs text-[#545454] leading-relaxed whitespace-pre-wrap">
                                      {recipe.preparation}
                                    </p>
                                  </div>

                                  <p className="text-[10px] text-[#545454] italic">
                                    Lembre-se: adapte sempre às orientações do pediatra.
                                  </p>

                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSaveRecipe(recipe)}
                                    disabled={!canSave}
                                    className="w-full"
                                  >
                                    Salvar esta receita no planner
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[11px] text-[#545454] mt-2">
                        Toque em &quot;Ver detalhes&quot; para escolher qual receita salvar no
                        planner.
                      </p>
                    </>
                  )}

                  {!recipesLoading &&
                    (!recipes || recipes.length === 0) &&
                    !isBabyUnderSixMonths && (
                      <div className="rounded-2xl bg-[#ffd8e6]/10 p-3">
                        <p className="text-[11px] text-[#545454]">
                          Clique em &quot;Gerar receitas&quot; para receber sugestões adaptadas à
                          idade do seu filho.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </SoftCard>

            {/* 2-Column Grid: Ideias Rápidas + Inspirações do Dia */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Ideias Rápidas */}
              <SoftCard
                id="rotina-leve-ideias"
                className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="space-y-6 flex flex-col h-full">
                  <div className="space-y-1 pb-2">
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                      Ideias Rápidas
                    </h3>
                    <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                      Inspirações simples para deixar o dia mais leve.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenIdeas((prev) => !prev)}
                    className="text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff005e]/60"
                  >
                    {openIdeas ? 'Ver menos ↑' : 'Ver ideias →'}
                  </button>

                  {openIdeas && (
                    <div className="space-y-3 text-xs flex-1">
                      <div>
                        <p className="mb-1 font-medium text-[#2f3a56]">Tempo disponível</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setTempoDisponivel((current) => (current === '5' ? null : '5'))
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tempoDisponivel === '5'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            5 min
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTempoDisponivel((current) => (current === '10' ? null : '10'))
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tempoDisponivel === '10'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            10 min
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTempoDisponivel((current) => (current === '20' ? null : '20'))
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tempoDisponivel === '20'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            20 min
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTempoDisponivel((current) => (current === '30+' ? null : '30+'))
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tempoDisponivel === '30+'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            30+
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 font-medium text-[#2f3a56]">Com quem</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setComQuem((current) => (current === 'so-eu' ? null : 'so-eu'))
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              comQuem === 'so-eu'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Só eu
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setComQuem((current) =>
                                current === 'eu-e-meu-filho' ? null : 'eu-e-meu-filho',
                              )
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              comQuem === 'eu-e-meu-filho'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Eu e meu filho
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setComQuem((current) =>
                                current === 'familia-toda' ? null : 'familia-toda',
                              )
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              comQuem === 'familia-toda'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Família toda
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 font-medium text-[#2f3a56]">Tipo de ideia</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setTipoIdeia((current) =>
                                current === 'brincadeira' ? null : 'brincadeira',
                              )
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tipoIdeia === 'brincadeira'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Brincadeira
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTipoIdeia((current) =>
                                current === 'organizacao' ? null : 'organizacao',
                              )
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tipoIdeia === 'organizacao'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Organização da casa
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTipoIdeia((current) =>
                                current === 'autocuidado' ? null : 'autocuidado',
                              )
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tipoIdeia === 'autocuidado'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Autocuidado
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTipoIdeia((current) =>
                                current === 'receita-rapida' ? null : 'receita-rapida',
                              )
                            }
                            className={clsx(
                              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20',
                              tipoIdeia === 'receita-rapida'
                                ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15',
                            )}
                          >
                            Receita rápida
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerateIdeas}
                        disabled={ideasLoading}
                        className="w-full"
                      >
                        {ideasLoading ? 'Gerando ideias…' : 'Gerar ideias'}
                      </Button>

                      <div className="rounded-2xl bg-[#ffd8e6]/10 p-3">
                        <p className="text-xs font-medium text-[#2f3a56] mb-2">
                          Sugestões para agora
                        </p>

                        {ideasLoading && (
                          <p className="text-[11px] text-[#545454]">
                            Pensando em pequenas ações que cabem no seu momento…
                          </p>
                        )}

                        {!ideasLoading && ideas && (
                          <ul className="space-y-2 text-xs text-[#545454]">
                            {ideas.map((idea) => (
                              <li key={idea.id}>• {idea.text}</li>
                            ))}
                          </ul>
                        )}

                        {!ideasLoading && !ideas && (
                          <ul className="space-y-2 text-xs text-[#545454]">
                            <li>• Mini brincadeira sensorial com objetos da sala.</li>
                            <li>
                              • Conexão de 5 minutos: conte algo bom do seu dia para o seu filho.
                            </li>
                            <li>
                              • Ritual rápido: uma pausa tranquila juntas antes de recomeçar.
                            </li>
                          </ul>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveIdeia}
                          className="w-full mt-3"
                        >
                          Salvar no planner
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SoftCard>

              {/* Inspirações do Dia */}
              <SoftCard
                id="rotina-leve-inspiracoes"
                className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="space-y-6 flex flex-col h-full">
                  <div className="space-y-1 pb-2">
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                      Inspirações do Dia
                    </h3>
                    <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                      Uma frase e um pequeno cuidado para hoje.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenInspiration((prev) => !prev)}
                    className="text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff005e]/60"
                  >
                    {openInspiration ? 'Ver menos ↑' : 'Ver inspiração →'}
                  </button>

                  {openInspiration && (
                    <div className="text-xs space-y-3 flex-1">
                      <div className="space-y-1">
                        <p className="font-medium text-[#2f3a56]">Foco de hoje</p>
                        <select
                          className="w-full rounded-2xl border border-[#ffd8e6] px-3 py-2 text-xs text-[#2f3a56] focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                          value={focusOfDay}
                          onChange={(e) => setFocusOfDay(e.target.value)}
                        >
                          <option>Cansaço</option>
                          <option>Culpa</option>
                          <option>Organização</option>
                          <option>Conexão com o filho</option>
                        </select>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerateInspiration}
                        disabled={inspirationLoading}
                        className="w-full"
                      >
                        {inspirationLoading ? 'Gerando inspiração…' : 'Gerar inspiração'}
                      </Button>

                      <div className="rounded-2xl bg-[#ffd8e6]/10 p-3 text-xs text-[#545454] space-y-3">
                        {inspirationLoading && (
                          <p className="text-[11px]">
                            Pensando em uma frase e um cuidado especial para hoje…
                          </p>
                        )}

                        {!inspirationLoading && (
                          <>
                            <div>
                              <p className="mb-1 text-[11px] font-medium text-[#2f3a56]">
                                Frase de hoje
                              </p>
                              <p>
                                {(inspiration && inspiration.phrase) ||
                                  'Você não precisa dar conta de tudo hoje.'}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-medium text-[#2f3a56]">
                                Pequeno cuidado
                              </p>
                              <p>
                                {(inspiration && inspiration.care) ||
                                  '1 minuto de respiração consciente antes de retomar a próxima tarefa.'}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-medium text-[#2f3a56]">
                                Mini ritual
                              </p>
                              <p>
                                {(inspiration && inspiration.ritual) ||
                                  'Envie uma mensagem carinhosa para alguém que te apoia.'}
                              </p>
                            </div>
                          </>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveInspiracao}
                          className="w-full mt-2"
                        >
                          Salvar inspiração no planner
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SoftCard>
            </div>
          </div>

          {/* Resumo rápido do que já foi salvo no Planner */}
          <SoftCard
            id="rotina-leve-planner"
            className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_10px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Seu resumo na Rotina Leve
                </p>
                {savedRecipesCount === 0 && savedInspirationCount === 0 ? (
                  <p className="text-sm text-[#545454]">
                    Conforme você salvar receitas e inspirações por aqui, este espaço mostra um
                    resumo rápido do que já está no seu planner.
                  </p>
                ) : (
                  <p className="text-sm text-[#545454]">
                    Você já salvou{' '}
                    <span className="font-semibold text-[#2f3a56]">
                      {savedRecipesCount} receita(s)
                    </span>{' '}
                    e{' '}
                    <span className="font-semibold text-[#2f3a56]">
                      {savedInspirationCount} inspiração(ões)
                    </span>{' '}
                    deste mini-hub no seu planner.
                  </p>
                )}
              </div>

              {lastInspiration && (
                <div className="mt-3 md:mt-0 md:max-w-sm rounded-2xl bg-[#ffd8e6]/20 border border-[#ffd8e6]/60 px-4 py-3 space-y-1">
                  <p className="text-[11px] font-semibold text-[#2f3a56] uppercase tracking-wide">
                    Última inspiração salva
                  </p>
                  {lastInspiration.payload?.frase && (
                    <p className="text-xs text-[#545454]">
                      <span className="font-medium">Frase: </span>
                      {lastInspiration.payload.frase}
                    </p>
                  )}
                  {lastInspiration.payload?.pequenoCuidado && (
                    <p className="text-xs text-[#545454]">
                      <span className="font-medium">Cuidado: </span>
                      {lastInspiration.payload.pequenoCuidado}
                    </p>
                  )}
                </div>
              )}
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="meu-dia-rotina-leve" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
