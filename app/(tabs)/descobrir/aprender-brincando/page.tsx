'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function AprenderBrincandoPage() {
  return (
    <PageTemplate
      label="DESCOBRIR"
      title="Aprender Brincando"
      subtitle="Ideias rápidas para o dia a dia."
    >
      <div className="px-4 py-6 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          {/* Intro */}
          <section className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Brincadeiras que também ensinam
            </h1>
            <p className="text-sm leading-relaxed text-gray-700">
              Este mini hub vai reunir ideias simples, rápidas e possíveis para você
              brincar com seu filho mesmo em dias corridos. Em breve, cada card aqui
              vai abrir sugestões práticas para diferentes momentos.
            </p>
          </section>

          {/* Cards grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Brincar em 5 minutos
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Ideias rápidas para encaixar entre uma tarefa e outra.
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
                Brincar com o que tem
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Atividades usando objetos que você já tem em casa.
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
                Brincar e aprender
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Ideias que estimulam curiosidade, linguagem e imaginação.
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
                Brincar ao ar livre
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Sugestões simples para quando der para sair um pouquinho.
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
