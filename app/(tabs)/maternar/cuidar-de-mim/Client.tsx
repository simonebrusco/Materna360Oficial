'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'

export default function Client() {
  useEffect(() => {
    try {
      track('nav.view', {
        page: 'cuidar-de-mim',
        timestamp: new Date().toISOString(),
      })
    } catch {}
  }, [])

  return (
    <main
      data-tab="maternar-cuidar-de-mim"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        relative
        overflow-hidden
      "
    >
      {/* HALOS DE LUZ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-[#fd2597]/30 blur-[90px] rounded-full"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-[#fdbed7]/40 blur-[110px] rounded-full"></div>
      </div>

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-5 md:px-6">

          {/* HERO PREMIUM — ESTAÇÃO SERENIDADE */}
          <header className="pt-10 md:pt-14 mb-10">
            <Reveal>
              <h1
                className="
                  text-3xl md:text-4xl
                  font-semibold
                  text-[#2f3a56]
                  leading-tight
                "
              >
                Cuidar de Mim
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p
                className="
                  text-[15px] md:text-[17px]
                  text-[#545454]
                  mt-2
                  max-w-xl
                  leading-relaxed
                "
              >
                Um espaço suave para você respirar, sentir e escolher pequenos gestos de autocuidado.
              </p>
            </Reveal>
          </header>

          {/* PORTAIS PREMIUM — 4 ESTAÇÕES INTERNAS */}

          {/* ============================= */}
          {/* 1. MEU RITMO HOJE */}
          {/* ============================= */}
          <Reveal>
            <section
              id="ritmo"
              className="
                bg-white/60
                backdrop-blur-xl
                rounded-3xl
                shadow-[0_8px_30px_rgba(253,38,151,0.15)]
                p-6 md:p-7
                mb-8
                border border-white/50
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <AppIcon name="heart" size={26} className="text-[#fd2597]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#2f3a56]">
                    Meu ritmo hoje
                  </h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Como seu corpo e sua mente chegam até aqui?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {['leve', 'cansada', 'animada', 'sobrecarregada'].map((state) => (
                  <button
                    key={state}
                    className="
                      rounded-xl
                      bg-white/80
                      backdrop-blur
                      text-[#2f3a56]
                      text-sm
                      py-3
                      shadow-[0_3px_10px_rgba(0,0,0,0.05)]
                      hover:bg-white hover:shadow-[0_5px_18px_rgba(0,0,0,0.08)]
                      transition
                    "
                  >
                    {state}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Se quiser, escreva algumas palavras sobre como você está..."
                className="
                  mt-5 w-full rounded-2xl p-4 text-[14px]
                  bg-white/70 backdrop-blur
                  border border-[#f5d7e5]
                  focus:outline-none focus:ring-2 focus:ring-[#fd2597]/50
                  text-[#2f3a56]
                  placeholder:text-[#a0a0a0]
                  min-h-[98px]
                "
              />
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 2. MINI ROTINA DE AUTOCUIDADO */}
          {/* ============================= */}
          <Reveal>
            <section
              id="mini-rotina"
              className="
                bg-white/65
                backdrop-blur-xl
                rounded-3xl
                shadow-[0_8px_30px_rgba(184,35,107,0.15)]
                p-6 md:p-7
                mb-8
                border border-white/50
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <AppIcon name="sparkles" size={26} className="text-[#b8236b]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#2f3a56]">
                    Mini rotina de autocuidado
                  </h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Pequenos gestos de 3–5 minutos para você se reencontrar.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {[
                  'Alongamento leve por 1 minuto',
                  'Um copo de água com respiração profunda',
                  'Organizar um cantinho que acalma',
                  'Passar um hidratante com calma',
                ].map((step) => (
                  <div
                    key={step}
                    className="
                      bg-white/80 backdrop-blur rounded-xl
                      p-4 text-[14px]
                      shadow-[0_3px_10px_rgba(0,0,0,0.05)]
                      border border-[#f5d7e5]
                    "
                  >
                    {step}
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 3. PAUSAS RÁPIDAS */}
          {/* ============================= */}
          <Reveal>
            <section
              id="pausas"
              className="
                bg-white/55
                backdrop-blur-xl
                rounded-3xl
                shadow-[0_8px_28px_rgba(184,35,107,0.12)]
                p-6 md:p-7
                mb-8
                border border-white/50
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <AppIcon name="timer" size={26} className="text-[#fd2597]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#2f3a56]">
                    Pausas rápidas
                  </h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Respirar, pausar, sentir. Um instante só seu.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  'Respirar 1 min',
                  'Água + pausa',
                  'Alongar pescoço',
                  'Olhar pela janela',
                ].map((item) => (
                  <div
                    key={item}
                    className="
                      bg-white/80 backdrop-blur
                      rounded-xl p-4 text-[14px]
                      shadow-[0_3px_10px_rgba(0,0,0,0.05)]
                      border border-[#f5d7e5]
                    "
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 4. PARA VOCÊ HOJE */}
          {/* ============================= */}
          <Reveal>
            <section
              id="para-voce"
              className="
                bg-white/60
                backdrop-blur-xl
                rounded-3xl
                shadow-[0_8px_30px_rgba(253,38,151,0.12)]
                p-6 md:p-7
                mb-10
                border border-white/50
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <AppIcon name="sparkles" size={26} className="text-[#fd2597]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#2f3a56]">
                    Para você hoje
                  </h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Um gesto gentil para lembrar: você importa.
                  </p>
                </div>
              </div>

              <div
                className="
                  bg-white/80 backdrop-blur
                  p-5 rounded-2xl
                  shadow-[0_3px_12px_rgba(0,0,0,0.06)]
                  border border-[#f5d7e5]
                  text-[15px] text-[#545454]
                  leading-relaxed
                "
              >
                “Hoje, escolha algo que cuide de você do mesmo jeito que você cuida de todo mundo.”
              </div>
            </section>
          </Reveal>

          <div className="mt-10">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
