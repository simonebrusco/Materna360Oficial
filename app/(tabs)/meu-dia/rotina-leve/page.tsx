'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import { toast } from '@/app/lib/toast'

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
          text: 'Um pequeno ritual de respiração profunda juntas antes de retomar as tarefas.',
        },
      ])
    }, 800)
  })
}

function mockGenerateRecipes(): Promise<RecipeSuggestion[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'recipe-1',
          title: 'Creminho de aveia rápida',
          description: 'Aveia, leite ou bebida vegetal e fruta amassada. Ideal para manhãs corridas.',
          meta: 'Pronto em ~10 min · a partir de 1 ano',
        },
        {
          id: 'recipe-2',
          title: 'Banana amassada com chia',
          description: 'Combinação simples para lanches rápidos e nutritivos.',
          meta: 'Pronto em ~5 min · a partir de 6 meses',
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

export default function RotinaLevePage() {
  const [openIdeas, setOpenIdeas] = useState(false)
  const [openInspiration, setOpenInspiration] = useState(false)

  // Receitas Inteligentes
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipes, setRecipes] = useState<RecipeSuggestion[] | null>(null)

  // Ideias Rápidas
  const [ideasLoading, setIdeasLoading] = useState(false)
  const [ideas, setIdeas] = useState<QuickIdea[] | null>(null)

  // Ideias Rápidas - Filter State (simple, explicit)
  const [tempoDisponivel, setTempoDisponivel] = useState<string | null>(null)
  const [comQuem, setComQuem] = useState<string | null>(null)
  const [tipoIdeia, setTipoIdeia] = useState<string | null>(null)

  // Inspirações do Dia
  const [inspirationLoading, setInspirationLoading] = useState(false)
  const [inspiration, setInspiration] = useState<Inspiration | null>(null)

  const { addItem } = usePlannerSavedContents()

  const handleSaveIdeia = () => {
    try {
      addItem({
        origin: 'rotina-leve',
        type: 'insight',
        title: 'Ideia rápida para agora',
        payload: {
          description: 'Mini brincadeira sensorial com objetos da sala. Conexão de 5 minutos: conte algo bom do seu dia para o seu filho. Ritual rápido: uma respiração profunda juntas antes de recomeçar.',
        },
      })
      console.log('[Rotina Leve] Idea saved to planner')
    } catch (error) {
      console.error('[Rotina Leve] Error saving idea:', error)
    }
  }

  const handleSaveRecipe = () => {
    try {
      addItem({
        origin: 'rotina-leve',
        type: 'recipe',
        title: 'Sugestões de receitas de hoje',
        payload: {
          description: 'Creminho de aveia rápida e banana com chia.',
        },
      })
      console.log('[Rotina Leve] Recipe saved to planner')
    } catch (error) {
      console.error('[Rotina Leve] Error saving recipe:', error)
    }
  }

  const handleSaveInspiracao = () => {
    try {
      addItem({
        origin: 'rotina-leve',
        type: 'insight',
        title: 'Inspiração do dia',
        payload: {
          description: 'Você não precisa dar conta de tudo hoje. Pequeno cuidado: 1 minuto de respiração consciente antes de retomar a próxima tarefa. Mini ritual: envie uma mensagem carinhosa para alguém que te apoia.',
        },
      })
      console.log('[Rotina Leve] Inspiration saved to planner')
    } catch (error) {
      console.error('[Rotina Leve] Error saving inspiration:', error)
    }
  }

  const handleGenerateRecipes = async () => {
    setRecipesLoading(true)
    const result = await mockGenerateRecipes()
    setRecipes(result)
    setRecipesLoading(false)
  }

  const handleGenerateIdeas = async () => {
    setIdeasLoading(true)
    const result = await mockGenerateIdeas()
    setIdeas(result)
    setIdeasLoading(false)
  }

  const handleGenerateInspiration = async () => {
    setInspirationLoading(true)
    const result = await mockGenerateInspiration()
    setInspiration(result)
    setInspirationLoading(false)
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <ClientOnly>
        {/* SectionWrapper */}
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="space-y-6">
            {/* HERO CARD: Receitas Inteligentes */}
            <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] transition-all duration-200">
              <h3 className="text-base font-semibold text-gray-900">Receitas Inteligentes</h3>
              <p className="mt-1 text-sm text-gray-600">
                Você diz o ingrediente, eu te ajudo com o resto.
              </p>

              {/* Form Inputs */}
              <div className="mt-4 space-y-3 text-xs">
                <div className="space-y-1">
                  <p className="font-medium text-gray-800">Ingrediente principal</p>
                  <input
                    type="text"
                    placeholder="Ex.: banana, aveia, frango..."
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-gray-800">Tipo de refeição</p>
                    <select className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-600">
                      <option>Lanche</option>
                      <option>Almoço / Jantar</option>
                      <option>Café da manhã</option>
                      <option>Sobremesa leve</option>
                    </select>
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-gray-800">Tempo de preparo</p>
                    <select className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-600">
                      <option>10 min</option>
                      <option>20 min</option>
                      <option>30 min</option>
                      <option>40+ min</option>
                    </select>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-[11px] text-primary-600">
                  <span>Idade principal: 2 anos</span>
                </div>
              </div>

              {/* Age Rule Message */}
              <p className="mt-3 text-[11px] text-gray-500">
                Para bebês menores de 6 meses, o ideal é manter o foco no aleitamento materno e seguir sempre a orientação do pediatra.
              </p>

              {/* Generate Button + Plan Counter */}
              <button
                type="button"
                onClick={handleGenerateRecipes}
                disabled={recipesLoading}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] px-6 py-2.5 text-base font-semibold text-white shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {recipesLoading ? 'Gerando receitas…' : 'Gerar receitas'}
              </button>

              <p className="mt-2 text-[11px] text-gray-500">
                Hoje você já usou <span className="font-semibold text-gray-700">1 de 3</span> sugestões do seu plano.
              </p>

              {/* Recipes Results */}
              <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                {recipesLoading && (
                  <p className="text-[11px] text-gray-500">
                    Estou pensando nas melhores opções pra hoje…
                  </p>
                )}

                {!recipesLoading && recipes && (
                  <>
                    <p className="text-xs font-medium text-gray-800 mb-2">
                      Sugestões de hoje
                    </p>
                    <ul className="space-y-2 text-xs text-gray-700">
                      {recipes.map((recipe) => (
                        <li key={recipe.id}>
                          <p className="font-semibold text-gray-900">{recipe.title}</p>
                          <p className="text-[11px] text-gray-600">{recipe.description}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{recipe.meta}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {!recipesLoading && !recipes && (
                  <p className="text-[11px] text-gray-500">
                    Clique em &quot;Gerar receitas&quot; para receber sugestões adaptadas à idade do seu filho.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="mt-3 w-full rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary-600 shadow-sm border border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  Salvar receitas no planner
                </button>
              </div>
            </div>

            {/* 2-Column Grid: Ideias Rápidas + Inspirações do Dia */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Ideias Rápidas - Collapsed by default */}
              <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] transition-all duration-200">
                <h3 className="text-base font-semibold text-gray-900">Ideias Rápidas</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Inspirações simples para deixar o dia mais leve.
                </p>
                <button
                  type="button"
                  onClick={() => setOpenIdeas((prev) => !prev)}
                  className="text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                >
                  {openIdeas ? 'Ver menos ↑' : 'Ver ideias →'}
                </button>

                {openIdeas && (
                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <p className="mb-1 font-medium text-gray-800">Tempo disponível</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setTempoDisponivel((current) => (current === '5' ? null : '5'))
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tempoDisponivel === '5'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
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
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tempoDisponivel === '10'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
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
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tempoDisponivel === '20'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
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
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tempoDisponivel === '30+'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          30+
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 font-medium text-gray-800">Com quem</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setComQuem((current) => (current === 'so-eu' ? null : 'so-eu'))
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            comQuem === 'so-eu'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Só eu
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setComQuem((current) =>
                              current === 'eu-e-meu-filho' ? null : 'eu-e-meu-filho'
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            comQuem === 'eu-e-meu-filho'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Eu e meu filho
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setComQuem((current) =>
                              current === 'familia-toda' ? null : 'familia-toda'
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            comQuem === 'familia-toda'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Família toda
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 font-medium text-gray-800">Tipo de ideia</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setTipoIdeia((current) =>
                              current === 'brincadeira' ? null : 'brincadeira'
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tipoIdeia === 'brincadeira'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Brincadeira
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setTipoIdeia((current) =>
                              current === 'organizacao' ? null : 'organizacao'
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tipoIdeia === 'organizacao'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Organização da casa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setTipoIdeia((current) =>
                              current === 'autocuidado' ? null : 'autocuidado'
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tipoIdeia === 'autocuidado'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Autocuidado
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setTipoIdeia((current) =>
                              current === 'receita-rapida' ? null : 'receita-rapida'
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                            tipoIdeia === 'receita-rapida'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                          )}
                        >
                          Receita rápida
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateIdeas}
                      disabled={ideasLoading}
                      className="mt-3 w-full rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] px-6 py-2.5 text-base font-semibold text-white shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {ideasLoading ? 'Gerando ideias…' : 'Gerar ideias'}
                    </button>

                    <div className="rounded-2xl bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-800 mb-2">
                        Sugestões para agora
                      </p>

                      {ideasLoading && (
                        <p className="text-[11px] text-gray-500">
                          Pensando em pequenas ações que cabem no seu momento…
                        </p>
                      )}

                      {!ideasLoading && ideas && (
                        <ul className="space-y-2 text-xs text-gray-700">
                          {ideas.map((idea) => (
                            <li key={idea.id}>• {idea.text}</li>
                          ))}
                        </ul>
                      )}

                      {!ideasLoading && !ideas && (
                        <ul className="space-y-2 text-xs text-gray-700">
                          <li>• Mini brincadeira sensorial com objetos da sala.</li>
                          <li>• Conexão de 5 minutos: conte algo bom do seu dia para o seu filho.</li>
                          <li>• Ritual rápido: uma respiração profunda juntas antes de recomeçar.</li>
                        </ul>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveIdeia}
                        className="mt-3 w-full rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                      >
                        Salvar no planner
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Inspirações do Dia - Collapsed by default */}
              <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] transition-all duration-200">
                <h3 className="text-base font-semibold text-gray-900">Inspirações do Dia</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Uma frase e um pequeno cuidado para hoje.
                </p>

                <button
                  type="button"
                  onClick={() => setOpenInspiration((prev) => !prev)}
                  className="text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                >
                  {openInspiration ? 'Ver menos ↑' : 'Ver inspiração →'}
                </button>

                {openInspiration && (
                  <div className="mt-4 text-xs text-gray-800 space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">Foco de hoje</p>
                      <select className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-600">
                        <option>Cansaço</option>
                        <option>Culpa</option>
                        <option>Organização</option>
                        <option>Conexão com o filho</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateInspiration}
                      disabled={inspirationLoading}
                      className="mt-3 w-full rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] px-6 py-2.5 text-base font-semibold text-white shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {inspirationLoading ? 'Gerando inspiração…' : 'Gerar inspiração'}
                    </button>

                    <div className="rounded-2xl bg-gray-50 p-3 text-xs text-gray-800 space-y-3">
                      {inspirationLoading && (
                        <p className="text-[11px] text-gray-500">
                          Pensando em uma frase e um cuidado especial para hoje…
                        </p>
                      )}

                      {!inspirationLoading && (
                        <>
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-gray-700">Frase de hoje</p>
                            <p>{(inspiration && inspiration.phrase) || 'Você não precisa dar conta de tudo hoje.'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-gray-700">Pequeno cuidado</p>
                            <p>{(inspiration && inspiration.care) || '1 minuto de respiração consciente antes de retomar a próxima tarefa.'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-gray-700">Mini ritual</p>
                            <p>{(inspiration && inspiration.ritual) || 'Envie uma mensagem carinhosa para alguém que te apoia.'}</p>
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveInspiracao}
                        className="mt-2 w-full rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                      >
                        Salvar inspiração no planner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Local Mini-Footer */}
          <p className="mt-8 text-center text-[11px] text-gray-500">
            Organize seu dia com leveza. Você merece.
          </p>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
