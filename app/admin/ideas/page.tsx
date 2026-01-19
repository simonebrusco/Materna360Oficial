import Link from 'next/link'

import { listIdeas, type AdmIdeaHub, type AdmIdeaStatus } from '../../lib/adm/adm.server'

type SearchParams = {
  hub?: string
  status?: string
  q?: string
}

const HUB_OPTIONS: { value: AdmIdeaHub; label: string }[] = [
  { value: 'meu-filho', label: 'Meu Filho' },
  { value: 'cuidar-de-mim', label: 'Cuidar de Mim' },
  { value: 'meu-dia-leve', label: 'Meu Dia Leve' },
]

const STATUS_OPTIONS: { value: AdmIdeaStatus; label: string }[] = [
  { value: 'published', label: 'Publicado' },
  { value: 'draft', label: 'Rascunho' },
]

function safeHub(v?: string): AdmIdeaHub | undefined {
  if (!v) return undefined
  return HUB_OPTIONS.some(x => x.value === v) ? (v as AdmIdeaHub) : undefined
}

function safeStatus(v?: string): AdmIdeaStatus | undefined {
  if (!v) return undefined
  return STATUS_OPTIONS.some(x => x.value === v) ? (v as AdmIdeaStatus) : undefined
}

function buildQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim()) sp.set(k, v.trim())
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export default async function AdminIdeasPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const hub = safeHub(searchParams?.hub)
  const status = safeStatus(searchParams?.status)
  const q = (searchParams?.q ?? '').trim() || undefined

  const ideas = await listIdeas({ hub, status, q })

  const qsKeep = buildQueryString({
    hub: hub,
    status: status,
    q: q ?? '',
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Ideias (ADM)</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Base curada para reduzir repetição e padronizar conteúdo editorial por hub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/ideas/new${qsKeep}`}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Nova ideia
          </Link>
        </div>
      </div>

      {/* Filtros (GET) */}
      <form method="get" className="rounded-lg border bg-white p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-neutral-700">Busca (título)</label>
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Ex: respiração, birra, pausa..."
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-neutral-700">Hub</label>
            <select
              name="hub"
              defaultValue={hub ?? ''}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            >
              <option value="">Todos</option>
              {HUB_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-neutral-700">Status</label>
            <select
              name="status"
              defaultValue={status ?? ''}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Filtrar
            </button>
            <Link
              href="/admin/ideas"
              className="w-full rounded-md border px-3 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      {/* Lista */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm text-neutral-700">
            Total: <span className="font-medium text-neutral-900">{ideas.length}</span>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Hub</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ideas.map(row => (
                <tr key={row.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">{row.id}</td>
                  <td className="px-4 py-3 text-neutral-800">{row.hub}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{row.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-neutral-600">
                      {row.short_description}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-800">{row.duration_minutes} min</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/ideas/${row.id}${qsKeep}`}
                      className="rounded-md border px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-50"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}

              {ideas.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-neutral-600" colSpan={6}>
                    Nenhuma ideia encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-neutral-500">
        Nota: esta tela é server-first (sem client state). Filtros via querystring (GET).
      </div>
    </div>
  )
}
