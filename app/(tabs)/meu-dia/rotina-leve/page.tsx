'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

export default function RotinaLevePage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <div className="space-y-16 md:space-y-20">
        <Reveal delay={0}>
          <div className="pt-4">
            <div className="mb-10 md:mb-14">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#2f3a56] mb-2 font-poppins">
                Inspire o seu dia
              </h2>
              <p className="text-base text-[#545454] leading-relaxed font-poppins">
                Comece trazendo leveza antes de organizar tudo.
              </p>
            </div>

            {/* 3-Column Grid with Uniform Height */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {/* CARD 1: Ideias Rápidas */}
              <Reveal delay={25}>
                <SoftCard className="bg-[#fffefe] shadow-[0_4px_18px_rgba(0,0,0,0.05)] h-full flex flex-col p-7 md:p-8 rounded-2xl">
                  <div className="flex-shrink-0">
                    <h3 className="text-base font-semibold text-[#2f3a56] mb-2 font-poppins">
                      Ideias Rápidas
                    </h3>
                    <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins mb-5">
                      Inspirações simples para deixar o dia mais leve.
                    </p>
                  </div>

                  {/* Filtros Rápidos */}
                  <div className="flex-shrink-0 mb-6">
                    <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                      Filtros rápidos
                    </p>

                    {/* Tempo */}
                    <div className="mb-4">
                      <p className="text-xs text-[#545454] font-medium mb-2">Tempo</p>
                      <div className="flex flex-wrap gap-2">
                        {['5 min', '10 min', '20 min'].map((time) => (
                          <button
                            key={time}
                            disabled
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-[#ececec] text-[#545454] cursor-default"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Energia */}
                    <div className="mb-4">
                      <p className="text-xs text-[#545454] font-medium mb-2">Energia</p>
                      <div className="flex flex-wrap gap-2">
                        {['Baixa', 'Média', 'Alta'].map((level) => (
                          <button
                            key={level}
                            disabled
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-[#ececec] text-[#545454] cursor-default"
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quem Participa */}
                    <div>
                      <p className="text-xs text-[#545454] font-medium mb-2">Quem participa</p>
                      <div className="flex flex-wrap gap-2">
                        {['Só eu', 'Eu + filho', 'Família'].map((person) => (
                          <button
                            key={person}
                            disabled
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-[#ececec] text-[#545454] cursor-default"
                          >
                            {person}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sugestões Iniciais */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                      Sugestões iniciais
                    </p>
                    <div className="space-y-3">
                      <div className="bg-[#f9f9f9] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#2f3a56] font-poppins mb-1">
                          🧩 Mini brincadeira sensorial
                        </p>
                        <p className="text-xs text-[#545454]/80">(5 min)</p>
                      </div>
                      <div className="bg-[#f9f9f9] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#2f3a56] font-poppins mb-1">
                          🫁 Conexão de 3 minutos
                        </p>
                        <p className="text-xs text-[#545454]/80">Respirem juntos</p>
                      </div>
                      <div className="bg-[#f9f9f9] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#2f3a56] font-poppins mb-1">
                          😊 Ritual do sorriso
                        </p>
                        <p className="text-xs text-[#545454]/80">1 minuto para começar bem</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex justify-end mt-6 pt-5 border-t border-[#ececec]/30">
                    <span className="text-xs font-semibold text-primary tracking-wide font-poppins cursor-default">
                      Ver mais →
                    </span>
                  </div>
                </SoftCard>
              </Reveal>

              {/* CARD 2: Receitas Inteligentes */}
              <Reveal delay={50}>
                <SoftCard className="bg-[#fffefe] shadow-[0_4px_18px_rgba(0,0,0,0.05)] h-full flex flex-col p-7 md:p-8 rounded-2xl">
                  <div className="flex-shrink-0">
                    <h3 className="text-base font-semibold text-[#2f3a56] mb-2 font-poppins">
                      Receitas Inteligentes
                    </h3>
                    <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins mb-5">
                      Você diz o ingrediente, eu te ajudo com o resto.
                    </p>
                  </div>

                  {/* Sugestões Iniciais */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                      Sugestões iniciais
                    </p>
                    <div className="space-y-3 mb-5">
                      <div className="bg-[#f9f9f9] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#2f3a56] font-poppins">
                          🥣 Creminho de Aveia Express
                        </p>
                        <p className="text-xs text-[#ff005e] font-poppins mt-1">ideal 1+ ano</p>
                      </div>
                      <div className="bg-[#f9f9f9] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#2f3a56] font-poppins">
                          🍌 Banana amassada com chia
                        </p>
                        <p className="text-xs text-[#ff005e] font-poppins mt-1">ideal 6+ meses</p>
                      </div>
                      <div className="bg-[#f9f9f9] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#2f3a56] font-poppins">
                          🥞 Panquequinha de banana
                        </p>
                        <p className="text-xs text-[#ff005e] font-poppins mt-1">ideal 1+ ano</p>
                      </div>
                    </div>

                    {/* Nota Educativa */}
                    <div className="bg-[#fff0f6] border border-[#ffd8e6] rounded-lg p-3 text-xs text-[#545454] leading-relaxed font-poppins">
                      💡 Receitas personalizadas por IA serão filtradas pela idade do seu filho. Crianças abaixo de 6 meses não recebem sugestões (foco no aleitamento materno).
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex justify-end mt-6 pt-5 border-t border-[#ececec]/30">
                    <span className="text-xs font-semibold text-primary tracking-wide font-poppins cursor-default">
                      Ver mais →
                    </span>
                  </div>
                </SoftCard>
              </Reveal>

              {/* CARD 3: Inspirações do Dia */}
              <Reveal delay={75}>
                <SoftCard className="bg-[#fffefe] shadow-[0_4px_18px_rgba(0,0,0,0.05)] h-full flex flex-col p-7 md:p-8 rounded-2xl">
                  <div className="flex-shrink-0">
                    <h3 className="text-base font-semibold text-[#2f3a56] mb-2 font-poppins">
                      Inspirações do Dia
                    </h3>
                    <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins mb-5">
                      Uma frase e um pequeno cuidado para hoje.
                    </p>
                  </div>

                  {/* Static Content */}
                  <div className="flex-1 space-y-4">
                    {/* Frase do Dia */}
                    <div>
                      <p className="text-xs font-semibold text-[#ff005e] uppercase tracking-wide mb-2">
                        Frase do dia
                      </p>
                      <p className="text-sm italic text-[#2f3a56] leading-relaxed font-poppins">
                        "Você não precisa dar conta de tudo hoje."
                      </p>
                    </div>

                    {/* Pequeno Cuidado */}
                    <div className="border-t border-[#ececec]/30 pt-4">
                      <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                        Pequeno cuidado
                      </p>
                      <p className="text-sm text-[#545454] leading-relaxed font-poppins">
                        1 minuto de respiração consciente.
                      </p>
                    </div>

                    {/* Mini Ritual */}
                    <div className="border-t border-[#ececec]/30 pt-4">
                      <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2">
                        Mini ritual
                      </p>
                      <p className="text-sm text-[#545454] leading-relaxed font-poppins">
                        Envie uma mensagem carinhosa para alguém importante.
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex justify-end mt-6 pt-5 border-t border-[#ececec]/30">
                    <span className="text-xs font-semibold text-primary tracking-wide font-poppins cursor-default">
                      Ver mais →
                    </span>
                  </div>
                </SoftCard>
              </Reveal>
            </div>
          </div>
        </Reveal>

        {/* Closing Message */}
        <div className="mt-8 pt-12 border-t border-[#ececec]/50">
          <p className="text-center text-base text-[#545454] leading-relaxed font-poppins">
            Organize seu dia com leveza. Pequenos passos fazem a grande diferença. <span className="text-[#ff005e] text-xl">❤️</span>
          </p>
        </div>
      </div>
    </PageTemplate>
  )
}
