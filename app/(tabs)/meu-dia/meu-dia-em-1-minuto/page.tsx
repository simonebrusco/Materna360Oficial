'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MeuDiaEm1MinutoPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Meu Dia em 1 Minuto"
      subtitle="Um resumo rápido do que realmente importou."
    >
      <div className="px-4 py-6 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          {/* Intro */}
          <section className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Veja o dia com mais leveza
            </h1>
            <p className="text-sm leading-relaxed text-gray-700">
              Esta página será o seu resumo diário: um jeito simples de enxergar
              como foi o dia, sem cobranças, sem perfeccionismo e sem listas
              infinitas. Em breve, cada card aqui vai trazer um pedacinho desse
              resumo.
            </p>
          </section>

          {/* Cards grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Como foi meu dia
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Uma visão geral do dia em poucas palavras.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-m360-pink-primary self-start"
              >
                Acessar →
              </button>
            </div>

            {/* Card 2 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Momentos importantes
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Destaques que você quer guardar da sua rotina de hoje.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-m360-pink-primary self-start"
              >
                Acessar →
              </button>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Como eu me senti
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Um retrato rápido das emoções que mais apareceram hoje.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-m360-pink-primary self-start"
              >
                Acessar →
              </button>
            </div>

            {/* Card 4 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                O que quero levar de hoje
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Um espaço para registrar o que você quer levar como aprendizado.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-m360-pink-primary self-start"
              >
                Acessar →
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageTemplate>
  )
}
