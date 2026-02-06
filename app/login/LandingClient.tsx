'use client'

import { Suspense } from 'react'

import BemVindaClient from '@/app/bem-vinda/BemVindaClient'
import LoginClient from '@/app/login/LoginClient'

export default function LandingClient() {
  return (
    <main className="relative min-h-screen bg-white overflow-hidden">
      {/* Soft background glow (Lovable-style) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ffe1f1]/70 blur-3xl" />
        <div className="absolute top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#fd2597]/10 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-[520px] w-[520px] rounded-full bg-[#fdbed7]/40 blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
          <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#fd2597]">
            Materna360
          </span>

          <a
            href="#acesso"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
          >
            Entrar
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14 pb-12">
        {/* Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="m360-pill">Acolhimento emocional</span>
          <span className="m360-pill">Sem julgamento</span>
          <span className="m360-pill">Para mães reais</span>
        </div>

        <h1 className="max-w-[720px] text-[34px] font-semibold leading-[1.15] text-[#2f3a56] md:text-[48px]">
          Um espaço de acolhimento emocional para mães.
          <br />
          Clareza e prática no dia real.
        </h1>

        <p className="mt-5 max-w-[520px] text-base leading-relaxed text-[#545454]">
          Cuidar de você não é egoísmo. É o primeiro passo para cuidar bem de quem você ama.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#acesso"
            className="btn-primary"
          >
            Começar agora
          </a>

          <a
            href="#acesso"
            className="btn-secondary"
          >
            Já tenho conta
          </a>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-auto w-full max-w-[1100px] px-6">
        <div className="h-px w-full bg-black/5" />
      </div>

      {/* CONTEÚDO + LOGIN */}
      <section
        id="acesso"
        className="relative z-10 mx-auto w-full max-w-[1100px] px-6 py-14"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* TEXTO */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#fd2597]">
              Acolhimento
            </p>

            <h2 className="text-[28px] font-semibold leading-tight text-[#2f3a56] md:text-[34px]">
              Você não está sozinha.
              <br />
              Você está cansada.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#545454]">
              E tudo bem sentir isso. A maternidade real não é perfeita — é intensa,
              bonita e, muitas vezes, solitária.
            </p>

            <p className="mt-4 text-base leading-relaxed text-[#545454]">
              O Materna360 foi criado para estar com você nos dias difíceis e nos dias bons.
              Sem julgamento, sem fórmulas mágicas.
            </p>

            <p className="mt-4 text-base leading-relaxed text-[#545454]">
              Apenas acolhimento, clareza e ferramentas práticas para o seu dia real como mãe.
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="m360-card p-8 md:p-10">
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
      </section>

      {/* CONTEÚDO EXISTENTE */}
      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-16">
        <div className="m360-card p-8 md:p-10">
          <BemVindaClient />
        </div>

        <footer className="mt-10 text-center text-xs text-[#545454]">
          © {new Date().getFullYear()} Materna360. Todos os direitos reservados.
        </footer>
      </section>
    </main>
  )
}
