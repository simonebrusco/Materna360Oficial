'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import LoginClient from '@/app/login/LoginClient'

export default function LandingClient() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Soft background glow (Lovable-style) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ffd8e6]/55 blur-3xl" />
        <div className="absolute top-28 -left-40 h-[460px] w-[460px] rounded-full bg-[#ff005e]/8 blur-3xl" />
        <div className="absolute bottom-0 -right-56 h-[560px] w-[560px] rounded-full bg-[#fd2597]/10 blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="page-shell flex items-center justify-between py-4">
          {/* LOGO */}
          <Image
            src="/images/logo-principal.png"
            alt="Materna360"
            width={160}
            height={32}
            priority
            className="h-6 w-auto"
          />

          <a
            href="#acesso"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
          >
            Entrar
          </a>
        </div>
      </nav>

      <div className="relative z-10">
        {/* HERO */}
        <section className="page-shell pb-10 pt-10 md:pb-12 md:pt-14">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-[#545454]">
              Acolhimento emocional
            </span>
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-[#545454]">
              Sem julgamento
            </span>
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-[#545454]">
              Para mães reais
            </span>
          </div>

          <h1 className="mt-6 max-w-[760px] text-[40px] font-semibold leading-[1.12] text-[#2f3a56] md:text-[44px]">
            Um espaço de acolhimento emocional para mães. Clareza e prática no dia real.
          </h1>

          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-[#6a6a6a]">
            Cuidar de você não é egoísmo. É o primeiro passo para cuidar bem de quem você ama.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#acesso" className="btn-primary">
              Começar agora <span className="ml-2">→</span>
            </a>

            <a href="#acesso" className="btn-secondary">
              Já tenho conta
            </a>
          </div>

          <div className="mt-10 border-t border-black/5" />
        </section>

        {/* SECTION: Acolhimento + Login */}
        <section id="acesso" className="page-shell pb-14 md:pb-16">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]">
                Acolhimento
              </p>

              <h2 className="mt-3 text-[34px] font-semibold leading-[1.12] text-[#2f3a56] md:text-[38px]">
                Você não está sozinha.
                <br />
                Você está cansada.
              </h2>

              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#6a6a6a]">
                <p>
                  E tudo bem sentir isso. A maternidade real não é perfeita — é intensa, bonita e,
                  muitas vezes, solitária.
                </p>
                <p>
                  O Materna360 foi criado para estar com você nos dias difíceis e nos dias bons. Sem
                  julgamento, sem fórmulas mágicas.
                </p>
                <p>
                  Apenas acolhimento, clareza e ferramentas práticas para o seu dia real como mãe.
                </p>
              </div>
            </div>

            {/* Right login card */}
            <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-[0_18px_60px_rgba(0,0,0,0.08)] md:p-9">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                    Carregando…
                  </div>
                }
              >
                <LoginClient />
              </Suspense>
            </div>
          </div>

          <footer className="mt-14 text-center text-xs text-[#6a6a6a]">
            © {new Date().getFullYear()} Materna360. Todos os direitos reservados.
          </footer>
        </section>
      </div>
    </main>
  )
}
