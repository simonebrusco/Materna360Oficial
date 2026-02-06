'use client'

import { Suspense } from 'react'

import BemVindaClient from '@/app/bem-vinda/BemVindaClient'
import LoginClient from '@/app/login/LoginClient'

export default function LandingClient() {
  return (
    <main className="lovable-login lovable-scope relative min-h-screen overflow-hidden bg-white">
      {/* Soft background glow (Lovable-style, sem degradê pesado) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ffd8e6]/60 blur-3xl" />
        <div className="absolute top-24 -left-28 h-[420px] w-[420px] rounded-full bg-[#ff005e]/10 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-[520px] w-[520px] rounded-full bg-[#ff4d8c]/15 blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#ff005e]">
            Materna360
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#acesso"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
            >
              Entrar
            </a>
          </div>
        </div>
      </nav>

      {/* DOBRA PRINCIPAL (Lovable: 2 cards grandes lado a lado) */}
      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-10 pt-10 md:pb-14 md:pt-14">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          {/* CARD: Mensagem / Hero */}
          <div className="rounded-3xl border border-black/10 bg-white/80 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur-md md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#ff005e]" />
              <span className="text-xs font-medium text-[#545454]">Acolhimento</span>
            </div>

            <h1 className="text-[32px] font-semibold leading-[1.12] text-[#2f3a56] md:text-[44px]">
              Você não está sozinha.
              <br />
              Você está cansada.
            </h1>

            <p className="mt-5 max-w-[520px] text-base leading-relaxed text-[#545454]">
              A maternidade real não é perfeita — é intensa, bonita e, muitas vezes, solitária.
              O Materna360 existe para te acompanhar com leveza, clareza e ferramentas práticas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#acesso"
                className="inline-flex items-center justify-center rounded-full bg-[#ff005e] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(255,0,94,0.28)] hover:opacity-95"
              >
                Começar agora
              </a>

              <a
                href="#conteudo"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
              >
                Ver como funciona
              </a>
            </div>

            {/* Mini “proof” (Lovable sempre tem micro reforço) */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold text-[#2f3a56]">Sem julgamento</p>
                <p className="mt-1 text-xs text-[#545454]">apoio real</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold text-[#2f3a56]">Pequenos passos</p>
                <p className="mt-1 text-xs text-[#545454]">dia possível</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold text-[#2f3a56]">Clareza emocional</p>
                <p className="mt-1 text-xs text-[#545454]">menos culpa</p>
              </div>
            </div>
          </div>

          {/* CARD: Login */}
          <div
            id="acesso"
            className="rounded-3xl border border-black/10 bg-white/80 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur-md md:p-10"
          >
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

      {/* SEÇÃO 2: conteúdo existente */}
      <section id="conteudo" className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-12">
        <div className="rounded-3xl border border-black/10 bg-white/85 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-md md:p-10">
          <BemVindaClient />
        </div>

        <footer className="mt-10 text-center text-xs text-[#545454]">
          © {new Date().getFullYear()} Materna360. Todos os direitos reservados.
        </footer>
      </section>
    </main>
  )
}
