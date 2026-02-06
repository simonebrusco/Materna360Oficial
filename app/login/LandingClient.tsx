'use client'

import { Suspense } from 'react'

import BemVindaClient from '@/app/bem-vinda/BemVindaClient'
import LoginClient from '@/app/login/LoginClient'

/**
 * Landing única: apresentação do produto + área de login/cadastro (auth).
 * Reaproveita os clients existentes para evitar regressão.
 */
export default function LandingClient() {
  return (
    <main className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#ff005e]">
              Materna360
            </div>
          </div>

          <a
            href="#acesso"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
          >
            Entrar
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto w-full max-w-[1100px] px-6 pb-10 pt-10 md:pb-16 md:pt-16">
        {/* Tags */}
        <div className="mb-8 flex flex-wrap gap-2">
          <span className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium text-[#545454]">
            Acolhimento emocional
          </span>
          <span className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium text-[#545454]">
            Sem julgamento
          </span>
          <span className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium text-[#545454]">
            Para mães reais
          </span>
        </div>

        <h1 className="mb-5 max-w-[680px] text-[32px] font-semibold leading-[1.15] text-[#545454] md:text-[44px]">
          Um espaço de acolhimento emocional para mães. Clareza e prática no dia real.
        </h1>

        <p className="mb-10 max-w-[520px] text-base leading-relaxed text-[#545454]">
          Cuidar de você não é egoísmo. É o primeiro passo para cuidar bem de quem você ama.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#acesso"
            className="inline-flex items-center justify-center rounded-full bg-[#ff005e] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,0,94,0.28)] hover:opacity-95"
          >
            Começar agora
          </a>

          <a
            href="#acesso"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
          >
            Já tenho conta
          </a>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-auto w-full max-w-[1100px] px-6">
        <div className="border-t border-black/5" />
      </div>

      {/* LOGIN / CONTENT */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-12 md:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: conteúdo já existente (sem mexer) */}
          <section className="order-2 lg:order-1">
            <BemVindaClient />
          </section>

          {/* Right: auth real (sem mexer) */}
          <section className="order-1 lg:order-2" id="acesso">
            <Suspense
              fallback={
                <div className="w-full rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  Carregando…
                </div>
              }
            >
              <LoginClient />
            </Suspense>
          </section>
        </div>
      </section>

      {/* QUOTE */}
      <section className="mx-auto w-full max-w-[1100px] px-6 pb-10">
        <div className="rounded-2xl border border-black/10 bg-[#ffd8e6]/55 px-8 py-8 md:px-12">
          <p className="text-base leading-relaxed text-[#545454]">
            Aqui, menos é suficiente.{' '}
            <span className="font-semibold text-[#2f3a56]">E suficiente é muito.</span>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto w-full max-w-[1100px] px-6 pb-10 text-center text-xs text-[#545454]">
        © {new Date().getFullYear()} Materna360 · Feito com carinho para mães reais.
      </footer>
    </main>
  )
}
