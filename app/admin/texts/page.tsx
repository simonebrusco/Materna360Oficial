import Link from 'next/link'
import { listEditorialTextsAdmin } from '@/app/lib/adm/adm.server'

type Status = 'draft' | 'published'

function Badge({ status }: { status: Status }) {
  const cls =
    status === 'published'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-neutral-200 text-neutral-700'
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {status.toUpperCase()}
    </span>
  )
}

function ChipLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        active ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      {children}
    </Link>
  )
}

export default async function AdminTextsPage({
  searchParams,
}: {
  searchParams?: { hub?: string; status?: string }
}) {
  const hub = (searchParams?.hub ?? '').trim()
  const statusRaw = (searchParams?.status ?? '').trim()
  const status: Status | undefined =
    statusRaw === 'published' || statusRaw === 'draft' ? (statusRaw as Status) : undefined

  const res = await listEditorialTextsAdmin({
    hub: hub || undefined,
    status,
    limit: 200,
  })

  const items = res.ok ? res.items : []

  const hubs = Array.from(new Set(items.map((x: any) => x.hub))).sort()

  function qs(next: { hub?: string; status?: string }) {
    const sp = new URLSearchParams()
    if (next.hub) sp.set('hub', next.hub)
    if (next.status) sp.set('status', next.status)
    const s = sp.toString()
    return s ? `?${s}` : ''
  }

  const activeHub = hub || ''
  const activeStatus = statusRaw || ''

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Textos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Leitura do <span className="font-mono">adm_editorial_texts</span>. Esta tela é
          read-only por enquanto (governança primeiro).
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold text-neutral-900">Como usar (operacional)</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 space-y-1">
          <li>
            <span className="font-semibold">Ideias</span> = <span className="font-mono">adm_ideas</span>{' '}
            (conteúdo “variável”, usado por hubs).
          </li>
          <li>
            <span className="font-semibold">Textos</span> = <span className="font-mono">adm_editorial_texts</span>{' '}
            (mensagens fixas/guia/aberturas/encerramentos).
          </li>
          <li>
            Para criar/atualizar textos: use Supabase SQL/CSV com campos{' '}
            <span className="font-mono">hub</span> + <span className="font-mono">key</span> +{' '}
            <span className="font-mono">body</span> + <span className="font-mono">status</span>.
          </li>
          <li>
            Próximo passo (depois): criar “detalhe read-only” por <span className="font-mono">id</span>{' '}
            e só então pensar em editor.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ChipLink href="/admin/texts" active={!activeHub && !activeStatus}>
          Todos
        </ChipLink>

        {hubs.map((h) => (
          <ChipLink
            key={h}
            href={`/admin/texts${qs({ hub: h, status: status || undefined })}`}
            active={activeHub === h}
          >
            {h}
          </ChipLink>
        ))}

        <div className="w-full h-2" />

        <ChipLink href={`/admin/texts${qs({ hub: hub || undefined })}`} active={!activeStatus}>
          Status: todos
        </ChipLink>
        <ChipLink
          href={`/admin/texts${qs({ hub: hub || undefined, status: 'published' })}`}
          active={activeStatus === 'published'}
        >
          Published
        </ChipLink>
        <ChipLink
          href={`/admin/texts${qs({ hub: hub || undefined, status: 'draft' })}`}
          active={activeStatus === 'draft'}
        >
          Draft
        </ChipLink>
      </div>

      {!res.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao listar: {res.error}
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">
          Itens ({items.length})
        </div>

        <div className="divide-y">
          {items.map((row: any) => (
            <div key={row.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">
                  {row.title ?? row.key}
                </div>
                <div className="mt-0.5 text-xs text-neutral-500 truncate">
                  <span className="font-mono">{row.hub}</span> ·{' '}
                  <span className="font-mono">{row.key}</span> ·{' '}
                  <span className="font-mono">{row.id}</span>
                </div>
                {row.updated_at && (
                  <div className="mt-1 text-xs text-neutral-400">
                    Atualizado: {new Date(row.updated_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Badge status={row.status as Status} />
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="px-4 py-6 text-sm text-neutral-600">
              Nenhum texto encontrado para os filtros atuais.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
