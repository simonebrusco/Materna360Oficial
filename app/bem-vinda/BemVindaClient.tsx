'use client'

import { useRouter } from 'next/navigation'

export default function BemVindaClient() {
  const router = useRouter()

  function onStart() {
    // Por enquanto, só navega.
    // O controle "já viu onboarding" entra no próximo passo.
    router.push('/meu-dia')
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[520px] rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        {/* BLOCO 1 — FRASE ÂNCORA */}
        <h1 className="text-2xl font-semibold leading-tight text-[var(--color-text-main)]">
          Você não está falhando.
          <br />
          Você está cansada.
        </h1>

        {/* BLOCO 2 — ESPELHAMENTO */}
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Entre trabalho, casa, filhos e expectativas,
          <br />
          o dia pesa — e mesmo fazendo o seu melhor,
          <br />
          parece que nunca é suficiente.
        </p>

        {/* BLOCO 3 — VIRADA EMOCIONAL */}
        <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-main)]">
          O <strong>Materna360</strong> não existe para te ensinar
          <br />
          a ser uma mãe melhor.
          <br />
          <span className="font-medium">Você já é.</span>
        </p>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Ele existe para te ajudar a viver a maternidade
          <br />
          com menos culpa e mais leveza.
        </p>

        {/* BLOCO 4 — PROMESSA CONCRETA */}
        <div className="mt-6 space-y-2 text-sm text-[var(--color-text-muted)]">
          <p>• Um jeito mais gentil de organizar o dia</p>
          <p>• Um espaço que também é seu</p>
          <p>• Pequenos apoios pensados para a vida real</p>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Nada de cobranças. Nada de perfeição.
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="mt-8 w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Começar pelo meu dia
        </button>
      </div>
    </div>
  )
}
