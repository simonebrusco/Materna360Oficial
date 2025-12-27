export const dynamic = 'force-dynamic'

function isInsightsEnabled() {
  return process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1'
}

export default function AdminInsightsPage() {
  const enabled = isInsightsEnabled()

  if (!enabled) {
    return (
      <main className="max-w-screen-md mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Insights (restrito)</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Este painel interno está desativado por padrão.
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Para habilitar em Preview/Dev, defina <code>NEXT_PUBLIC_FF_INTERNAL_INSIGHTS</code> como <code>1</code>.
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-screen-md mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-3 text-sm text-neutral-600">
        Painel interno em manutenção (P29). Base estável em primeiro lugar.
      </p>
    </main>
  )
}
