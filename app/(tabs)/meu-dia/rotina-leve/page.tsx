'use client'

import { useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

export default function RotinaLevePage() {
  const [openIdeas, setOpenIdeas] = useState(false)
  const [openInspiration, setOpenInspiration] = useState(false)

  const { addItem } = usePlannerSavedContents()

  const handleSaveIdeia = () => {
    addItem({
      origin: 'rotina-leve',
      type: 'insight',
      title: 'Ideia rápida para agora',
      payload: {
        description: 'Mini brincadeira sensorial com objetos da sala. Conexão de 5 minutos: conte algo bom do seu dia para o seu filho. Ritual rápido: uma respiração profunda juntas antes de recomeçar.',
      },
    })
  }

  const handleSaveRecipe = () => {
    addItem({
      origin: 'rotina-leve',
      type: 'recipe',
      title: 'Sugestões de receitas de hoje',
      payload: {
        description: 'Creminho de aveia rápida e banana com chia.',
      },
    })
  }

  const handleSaveInspiracao = () => {
    addItem({
      origin: 'rotina-leve',
      type: 'insight',
      title: 'Inspiração do dia',
      payload: {
        description: 'Você não precisa dar conta de tudo hoje. Pequeno cuidado: 1 minuto de respiração consciente antes de retomar a próxima tarefa. Mini ritual: envie uma mensagem carinhosa para alguém que te apoia.',
      },
    })
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <ClientOnly>
        {/* SectionWrapper */}
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-6">
            {/* HERO CARD: Receitas Inteligentes */}
            <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] transition-all duration-200">
              <h3 className="text-base font-semibold text-gray-900">Ideias Rápidas</h3>
              <p className="mt-1 text-sm text-gray-600">
                Inspirações simples para deixar o dia mais leve.
              </p>
              <button
                type="button"
                onClick={() => setIsIdeasOpen((v) => !v)}
                className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {isIdeasOpen ? 'Ver menos ↑' : 'Ver mais →'}
              </button>

              {/* Static Filters Grid */}
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <p className="mb-1 font-medium text-gray-800">Tempo disponível</p>
                  <div className="flex flex-wrap gap-2">
                    {['5 min', '10 min', '20 min', '30+'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled
                        className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-700 cursor-default"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 font-medium text-gray-800">Com quem</p>
                  <div className="flex flex-wrap gap-2">
                    {['Só eu', 'Eu e meu filho', 'Família toda'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled
                        className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-700 cursor-default"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 font-medium text-gray-800">Tipo de ideia</p>
                  <div className="flex flex-wrap gap-2">
                    {['Brincadeira', 'Organização da casa', 'Autocuidado', 'Receita rápida'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled
                        className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-700 cursor-default"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collapsible Results Area */}
              {isIdeasOpen && (
                <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-800 mb-2">
                    Sugestões para agora
                  </p>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li>• Mini brincadeira sensorial com objetos da sala.</li>
                    <li>• Conexão de 5 minutos: conte algo bom do seu dia para o seu filho.</li>
                    <li>• Ritual rápido: uma respiração profunda juntas antes de recomeçar.</li>
                  </ul>
                  <button
                    type="button"
                    onClick={handleSaveIdeia}
                    className="mt-3 w-full rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                  >
                    Salvar no planner
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: Receitas Inteligentes */}
            <div className="h-full rounded-3xl bg-white shadow-[0_4px_18px_rgba(0,0,0,0.05)] p-6 transition-all duration-200">
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
                Para bebês menores de 6 meses, o ideal é manter o foco no aleitamento materno e seguir sempre a orientação do pediatra. 💗
              </p>

              {/* Generate Button + Plan Counter */}
              <button
                type="button"
                className="mt-4 w-full rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
              >
                Gerar receitas 🍽️
              </button>

              <p className="mt-2 text-[11px] text-gray-500">
                Hoje você já usou <span className="font-semibold text-gray-700">1 de 3</span> sugestões do seu plano.
              </p>

              {/* Static Recipes List */}
              <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-800 mb-2">
                  Sugestões de hoje
                </p>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li>
                    <p className="font-semibold text-gray-900">Creminho de aveia rápida</p>
                    <p className="text-[11px] text-gray-600">
                      Aveia, leite ou bebida vegetal e fruta amassada. Ideal para manhãs corridas.
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">Pronto em ~10 min · a partir de 1 ano</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Banana amassada com chia</p>
                    <p className="text-[11px] text-gray-600">
                      Combinação simples para lanches rápidos e nutritivos.
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">Pronto em ~5 min · a partir de 6 meses</p>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="mt-3 w-full rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary-600 shadow-sm border border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  Salvar receitas no planner
                </button>
              </div>
            </div>

            {/* CARD 3: Inspirações do Dia */}
            <div className="h-full rounded-3xl bg-white shadow-[0_4px_18px_rgba(0,0,0,0.05)] p-6 transition-all duration-200">
              <h3 className="text-base font-semibold text-gray-900">Inspirações do Dia</h3>
              <p className="mt-1 text-sm text-gray-600">
                Uma frase e um pequeno cuidado para hoje.
              </p>

              <button
                type="button"
                onClick={() => setIsInspirationOpen((v) => !v)}
                className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {isInspirationOpen ? 'Ver menos ↑' : 'Ver mais →'}
              </button>

              {/* Focus Select */}
              <div className="mt-4 space-y-1 text-xs">
                <p className="font-medium text-gray-800">Foco de hoje</p>
                <select className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-600">
                  <option>Cansaço</option>
                  <option>Culpa</option>
                  <option>Organização</option>
                  <option>Conexão com o filho</option>
                </select>
              </div>

              {/* Collapsible Result Area */}
              {isInspirationOpen && (
                <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-xs text-gray-800 space-y-3">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-gray-700">Frase de hoje</p>
                    <p>Você não precisa dar conta de tudo hoje.</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-gray-700">Pequeno cuidado</p>
                    <p>1 minuto de respiração consciente antes de retomar a próxima tarefa.</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-gray-700">Mini ritual</p>
                    <p>Envie uma mensagem carinhosa para alguém que te apoia.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveInspiracao}
                    className="mt-2 w-full rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                  >
                    Salvar inspiração no planner
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Local Mini-Footer */}
          <p className="mt-8 text-center text-[11px] text-gray-500">
            Organize seu dia com leveza. Você merece. 💗
          </p>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
