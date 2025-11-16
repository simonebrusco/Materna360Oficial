'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MomentosQueContamPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Momentos que Contam"
      subtitle="Conexão diária em pequenos gestos."
    >
      <div className="px-4 py-6 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          {/* intro text */}
          <section className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Presença que faz diferença
            </h1>
            <p className="text-sm leading-relaxed text-gray-700">
              Aqui é o espaço para você cuidar dos momentos de conexão com seu filho.
              Em breve, este mini hub vai reunir ideias simples para estar junto,
              mesmo nos dias corridos.
            </p>
          </section>

          {/* cards grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Momento 1 a 1
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Alguns minutos só voc��s dois, sem distrações.
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
                Pequenos gestos
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Abraços, olhares e palavras que acolhem.
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
                Conversas do dia
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Perguntas simples para saber como ele está.
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
                Memórias do dia
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Um lugar para registrar o que marcou vocês hoje.
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
