'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MeuBemEstarPage() {
  return (
    <PageTemplate
      label="CUIDAR"
      title="Meu Bem-estar"
      subtitle="Seu momento de cuidado"
    >
      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-xl space-y-6">
          {/* Intro section */}
          <section className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Um espaço só para você
            </h1>
            <p className="text-sm leading-relaxed text-gray-700">
              Aqui é o seu cantinho dentro do Materna360. Em breve, este espaço
              vai reunir rotinas, pausas e pequenas práticas para você cuidar de
              si com mais leveza, sem culpa e sem pressão.
            </p>
          </section>

          {/* Highlight card */}
          <section className="rounded-3xl bg-white shadow-soft px-4 py-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500">
              SUGESTÃO DO DIA
            </p>
            <h2 className="text-base font-semibold text-gray-900">
              Comece com uma pausa de 3 minutos
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              Reserve um momento para respirar fundo, alongar o corpo e perceber
              como você está se sentindo agora. Em breve, você verá aqui áudios
              guiados e pequenas práticas para esses momentos.
            </p>
          </section>

          {/* Future content placeholder */}
          <section className="rounded-3xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-500">
            Esta área será usada para rotinas, listas de autocuidado e
            conteúdos especiais de bem-estar para você.
          </section>
        </div>
      </div>
    </PageTemplate>
  )
}
