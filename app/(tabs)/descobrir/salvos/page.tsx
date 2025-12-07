import Link from 'next/link'

export default function SalvosPage() {
  return (
    <main className="min-h-screen bg-[#fff5f9]">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-4">
        <Link
          href="/meu-dia"
          className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
        >
          <span>←</span>
          <span>Voltar</span>
        </Link>

        <h1 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
          Salvos
        </h1>

        <div className="mt-2 rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)] px-4 py-3 md:px-5 md:py-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Você ainda não salvou ideias no planner. Use os hubs do Materna360,
            como{' '}
            <span className="font-medium">Como Estou Hoje</span>,{' '}
            <span className="font-medium">Rotina Leve</span> e{' '}
            <span className="font-medium">Cuidar com Amor</span> e toque em
            <span className="font-medium"> "Salvar no planner"</span> sempre que
            quiser guardar algo.
          </p>

          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Para começar, acesse o seu dia em{' '}
            <Link
              href="/meu-dia"
              className="font-semibold text-[var(--color-brand)] underline-offset-2 hover:underline"
            >
              Meu Dia
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
