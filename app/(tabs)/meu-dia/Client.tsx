return (
  <main
    data-layout="page-template-v1"
    className="
      min-h-[100dvh]
      pb-32
      bg-[#FFE8F2]
      bg-[linear-gradient(to_bottom,#fd2597_0%,#FFD8E6_40%,#FFE8F2_100%)]
    "
  >
    <div className="mx-auto max-w-3xl px-4 md:px-6">
      {/* HERO — cópia do Maternar, só mudando textos */}
      <header className="pt-8 md:pt-10 mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
              MEU DIA
            </span>

            <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              Seu Dia Organizado
            </h1>

            <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              Um espaço para planejar com leveza.
            </p>

            {/* Saudação + frase diária, alinhadas ao hero */}
            <div className="pt-3 space-y-1">
              <ClientOnly>
                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  {greeting || 'Bom dia'}
                </h2>
              </ClientOnly>

              <p className="text-sm md:text-base text-white/95 leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                &quot;{dailyMessage}&quot;
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Planner inteiro logo abaixo do hero */}
      <WeeklyPlannerShell />

      {/* Footer motivacional específico do hub Meu Dia */}
      <div className="mt-8 md:mt-10">
        <MotivationalFooter routeKey="meu-dia-hub" />
      </div>
    </div>

    {/* Rodapé legal */}
    <LegalFooter />
  </main>
);
