'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  console.error('[cuidar:error]', error)
  return (
    <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="font-semibold text-rose-700">Ops, algo deu errado ao carregar a página.</h2>
      <p className="mt-2 text-sm text-rose-800/80">Tente novamente. Se persistir, volte mais tarde.</p>
      <button onClick={reset} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-white">
        Tentar novamente
      </button>
    </div>
  )
}
