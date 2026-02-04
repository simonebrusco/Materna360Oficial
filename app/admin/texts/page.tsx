import Link from 'next/link'
import { AdminGuardRails } from '@/app/admin/_components/AdminGuardRails'
import { listEditorialTextsAdmin } from '@/app/lib/adm/adm.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SP = Record<string, string | string[] | undefined>

function spGet(sp: SP, key: string): string {
  const v = sp[key]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}

function clampInt(v: string, def: number, min: number, max: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, Math.floor(n)))
}

export default async function AdminTextsPage({ searchParams }: { searchParams: SP }) {
  const hub = spGet(searchParams, 'hub').trim()
  const status = spGet(searchParams, 'status').trim() as 'draft' | 'published' | ''
  const q = spGet(searchParams, 'q').trim()
  const page = clampInt(spGet(searchParams, 'page'), 1, 1, 9999)
  const limit = clampInt(spGet(searchParams, 'limit'), 50, 10, 200)

  const res = await listEditorialTextsAdmin({
    hub: hub || undefined,
    status: (status === 'draft' || status === 'published') ? status : undefined,
    limit,
    // NOTE: esta função (no checklist) já ordena updated_at desc
  })

  const items = (res?.items ?? []).filter((it: any) => {
    if (!q) return true
    const hay = `${it.id ?? ''} ${it.hub ?? ''} ${it.key ?? ''} ${it.title ?? ''}`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  // paginação simples em memória (ok para read-only / MVP)
  const start = (page - 1) * limit
  const pageItems = items.slice(start, start + limit)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const mkHref = (p: number) => {
    const params = new URLSearchParams()
    if (hub) params.set('hub', hub)
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    params.set('limit', String(limit))
    params.set('page', String(p))
    return `/admin/texts?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-2xl font-semibold">Textos editoriais (read-only)</div>
        <div className="text-sm text-muted-foreground">
          Lista de <b>adm_editorial_texts</b>. Aqui você apenas <b>inspeciona</b>. Edição controlada fica fora da P34.ADM.2.
        </div>
      </div>

      <AdminGuardRails />

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-4" method="GET">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Hub</div>
          <input
            name="hub"
            defaultValue={hub}
            placeholder="ex: meu-dia-leve"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Status</div>
          <select name="status" defaultValue={status} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">(todos)</option>
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <div className="text-xs font-medium text-muted-foreground">Busca (id / key / title)</div>
          <input
            name="q"
            defaultValue={q}
            placeholder="ex: para_hoje"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <input type="hidden" name="limit" value={String(limit)} />
        <input type="hidden" name="page" value="1" />

        <div className="md:col-span-4 flex flex-wrap items-center gap-2">
          <button className="rounded-md bg-black px-4 py-2 text-sm text-white">Filtrar</button>
          <Link className="rounded-md border px-4 py-2 text-sm" href="/admin/texts">Limpar</Link>

          <div className="ml-auto text-sm text-muted-foreground">
            Total: <b>{total}</b>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-left">id</th>
              <th className="px-3 py-2 text-left">hub</th>
              <th className="px-3 py-2 text-left">key</th>
              <th className="px-3 py-2 text-left">status</th>
              <th className="px-3 py-2 text-left">title</th>
              <th className="px-3 py-2 text-left">updated_at</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((it: any) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{it.id}</td>
                <td className="px-3 py-2">{it.hub}</td>
                <td className="px-3 py-2 font-mono text-xs">{it.key}</td>
                <td className="px-3 py-2">{it.status}</td>
                <td className="px-3 py-2">{it.title}</td>
                <td className="px-3 py-2 font-mono text-xs">{String(it.updated_at ?? '')}</td>
              </tr>
            ))}
            {!pageItems.length && (
              <tr className="border-t">
                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={6}>
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Página <b>{page}</b> / <b>{totalPages}</b>
        </div>
        <div className="flex gap-2">
          <Link className={`rounded-md border px-3 py-2 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`} href={mkHref(Math.max(1, page - 1))}>
            Anterior
          </Link>
          <Link className={`rounded-md border px-3 py-2 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`} href={mkHref(Math.min(totalPages, page + 1))}>
            Próxima
          </Link>
        </div>
      </div>
    </div>
  )
}
