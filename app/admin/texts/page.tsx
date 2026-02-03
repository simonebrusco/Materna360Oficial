export default function AdminTextsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Textos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Estrutura pronta. Editor e conteúdo entram depois.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold text-neutral-900">Status</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
          <li>Listagem por hub/bloco/key (futuro)</li>
          <li>Edição de body + status (futuro)</li>
          <li>Upsert usando chave única (hub, key) (já validado)</li>
        </ul>
      </div>
    </div>
  )
}
