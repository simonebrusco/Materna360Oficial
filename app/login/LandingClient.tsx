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
    <main className="min-h-screen bg-gradient-to-b from-[#ff005e] via-[#ff4d8c] to-[#ffd8e6]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          {/* COLUNA: VENDA/APRESENTAÇÃO */}
          <section className="order-2 lg:order-1">
                      <div className="mb-6 rounded-3xl bg-white/85 backdrop-blur border border-white/60 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.15)]">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#ff005e]">
              Materna360
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#2f3a56] leading-tight">
              Um app emocional para mães — acolhimento, clareza e prática no dia real.
            </h1>
            <p className="mt-2 text-sm text-[#545454]">
              Entre para acessar o conteúdo e começar com leveza — sem autocobrança.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <a
                href="#acesso"
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold bg-[#ff005e] text-white shadow-[0_12px_30px_rgba(255,0,94,0.35)] hover:opacity-95"
              >
                Começar agora
              </a>
              <a
                href="#acesso"
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold border border-white/70 bg-white/60 text-[#2f3a56] hover:bg-white/80"
              >
                Já tenho conta
              </a>
            </div>
          </div>

            <BemVindaClient />
          </section>

          {/* COLUNA: AUTH */}
          <section className="order-1 lg:order-2" id="acesso">
            <Suspense fallback={<div className="rounded-3xl bg-white/90 border border-[var(--color-soft-strong)] p-6">Carregando…</div>}>
              <LoginClient />
            </Suspense>
          </section>
        </div>

        <footer className="mt-10 text-center text-xs text-white/70">
          © {new Date().getFullYear()} Materna360. Todos os direitos reservados.
        </footer>
      </div>
    </main>
  )
}
