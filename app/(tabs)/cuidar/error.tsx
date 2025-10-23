'use client'

export default function CuidarError({
  error,
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('[cuidar.error]', error?.message, error?.digest)
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 my-8">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-700">Oops! Algo deu errado ao carregar esta seção.</h2>
        <p className="mt-2 text-sm text-rose-800/80">Tente novamente. Se persistir, volte mais tarde.</p>
        <button className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-white" onClick={() => reset()}>
          Recarregar seção
        </button>
      </div>
    </div>
  )
}
