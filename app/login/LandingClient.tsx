'use client'

import { Suspense } from 'react'
import LoginClient from '@/app/login/LoginClient'

export default function LandingClient() {
  return (
    <main className="relative min-h-screen bg-white">
      {/* Soft background glow (Lovable-style) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ffd8e6]/55 blur-3xl" />
        <div className="absolute top-24 -left-32 h-[420px] w-[420px] rounded-full bg-[#ff005e]/10 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-[520px] w-[520px] rounded-full bg-[#ff4d8c]/12 blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold text-[#545454]">
            Materna360<span className="text-[#ff005e]">°</span>
          </div>

          <a
            href="#acesso"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-medium text-[#2f3a56] shadow-sm hover:bg-black/[0.02]"
          >
            Entrar
          </a>
        </div>
      </nav>

      {/* HERO (igual ao Lovable) */}
      <header className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-10 pt-10 md:pb-14 md:pt-14">
        <div className="flex flex-wrap gap-2">
          <span className="m360-pill">Acolhimento emocional</span>
          <span className="m360-pill">Sem julgamento</span>
          <span className="m360-pill">Para mães reais</span>
        </div>

        <h1 className="mt-6 max-w-[900px] text-[38px] font-semibold leading-[1.08] text-[#2f3a56] md:text-[56px]">
          Um espaço de acolhimento emocional para mães. Clareza e prática no dia real.
        </h1>

        <p className="mt-5 max-w-[560px] text-base leading-relaxed text-[#6a6a6a]">
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
      </header>

      {/* Divider fino (Lovable) */}
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6">
        <div className="h-px w-full bg-black/10" />
      </div>

      {/* DOBRA 2: texto + login */}
      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-16 pt-10 md:pt-12">
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12">
          {/* Texto esquerda */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff005e]">
              Acolhimento
            </p>

            <h2 className="mt-4 text-[34px] font-semibold leading-[1.12] text-[#2f3a56] md:text-[44px]">
              Você não está sozinha.
              <br />
              Você está cansada.
            </h2>

            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#6a6a6a]">
              <p>
                E tudo bem sentir isso. A maternidade real não é perfeita — é intensa, bonita e, muitas vezes, solitária.
              </p>
              <p>
                O Materna360 foi criado para estar com você nos dias difíceis e nos dias bons. Sem julgamento, sem fórmulas mágicas.
              </p>
              <p>
                Apenas acolhimento, clareza e ferramentas práticas para o seu dia real como mãe.
              </p>
            </div>
          </div>

          {/* Card login direita */}
          <div id="acesso" className="m360-card p-7 md:p-10">
            <h3 className="text-[20px] font-semibold text-[#2f3a56]">Acesse sua conta</h3>
            <p className="mt-2 text-sm text-[#6a6a6a]">
              Estamos felizes em te ver de volta 💕
            </p>

            <div className="mt-6">
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
        </div>

        <footer className="mt-14 text-center text-xs text-[#6a6a6a]">
          © {new Date().getFullYear()} Materna360. Todos os direitos reservados.
        </footer>
      </section>
    </main>
  )
}
