import { PageTemplate } from '@/components/common/PageTemplate'

export default function MinhaJornadaPage() {
  return (
    <PageTemplate
      label="EU360"
      title="Minha Jornada"
      subtitle="Seu progresso visto com mais carinho."
    >
      <div className="px-4 py-6 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          {/* Intro */}
          <section className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Olhando para a sua história
            </h1>
            <p className="text-sm leading-relaxed text-gray-700">
              Esta página será o seu espaço para enxergar a jornada de forma mais ampla:
              as fases, as conquistas e os aprendizados ao longo do tempo. Em breve,
              cada card aqui vai trazer visões diferentes sobre o seu caminho.
            </p>
          </section>

          {/* Cards grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Visão geral
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Um resumo dos principais momentos e fases da sua jornada.
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
                Conquistas
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Espaço para celebrar o que você já conseguiu, mesmo nas pequenas coisas.
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
                Emoções ao longo do tempo
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Uma forma de enxergar como você tem se sentido nas últimas semanas.
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
                Próximos passos
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Um lugar para definir, com calma, o que você gostaria de cuidar a seguir.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-m360-pink-primary self-start"
              >
                Acessar →
              </button>
            </div>

            {/* Card 5 */}
            <div className="rounded-3xl bg-white shadow-soft px-4 py-4 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />
              <h2 className="text-sm font-semibold text-gray-900">
                Guia do Desenvolvimento
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                Acompanhe as fases do seu filho com mais clareza.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-m360-pink-primary self-start"
              >
                Ver etapas →
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageTemplate>
  )
}
