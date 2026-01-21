// app/admin/ideas/[id]/page.tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { getIdea, updateIdea, type AdmIdeaHub, type AdmIdeaStatus } from '@/app/lib/adm/adm.server'

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

function buildQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim()) sp.set(k, v.trim())
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

function safeHub(v?: string): AdmIdeaHub {
  return HUB_OPTIONS.some(x => x.value === v) ? (v as AdmIdeaHub) : 'meu-filho'
}

function safeStatus(v?: string): AdmIdeaStatus {
  return STATUS_OPTIONS.some(x => x.value === v) ? (v as AdmIdeaStatus) : 'draft'
}

function safeInt(v: unknown, fallback: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.trunc(n)
}

export default async function AdminIdeaEditPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: SearchParams
}) {
  const id = params.id

  const qsKeep = buildQueryString({
    hub: searchParams?.hub ?? '',
    status: searchParams?.status ?? '',
    q: searchParams?.q ?? '',
  })

  const idea = await getIdea(id)
  if (!idea) return notFound()

  async function action(formData: FormData) {
    'use server'

    const hub = safeHub(String(formData.get('hub') ?? ''))
    const status = safeStatus(String(formData.get('status') ?? ''))
    const title = String(formData.get('title') ?? '').trim()
    const short_description = String(formData.get('short_description') ?? '').trim()

    const prev = safeInt(formData.get('duration_minutes_prev'), idea.duration_minutes ?? 10)
    const nextRaw = safeInt(formData.get('duration_minutes'), prev)
    const duration_minutes = Math.min(Math.max(nextRaw, 1), 60)

    if (!title) {
      redirect(`/admin/ideas/${id}${qsKeep}`)
    }

    await updateIdea(id, {
      hub,
      status,
      title,
      short_description,
      duration_minutes,
    })

    redirect(`/admin/ideas/${id}${qsKeep}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Editar ideia</h1>
          <p className="mt-1 text-sm text-neutral-600">ID é estável e não deve ser alterado após publicação.</p>
          <div className="mt-2 font-mono text-xs text-neutral-600">{idea.id}</div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/ideas${qsKeep}`}
            className="rounded-md border px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Voltar
          </Link>
        </div>
      </div>

      <form action={action} className="space-y-4 rounded-lg border bg-white p-4">
        <input type="hidden" name="duration_minutes_prev" value={String(idea.duration_minutes ?? 10)} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700">Hub</label>
            <select
              name="hub"
              defaultValue={idea.hub}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            >
              {HUB_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700">Status</label>
            <select
              name="status"
              defaultValue={idea.status}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Título</label>
          <input
            name="title"
            defaultValue={idea.title}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Descrição curta</label>
          <textarea
            name="short_description"
            defaultValue={idea.short_description ?? ''}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700">Duração (min)</label>
            <input
              name="duration_minutes"
              type="number"
              min={1}
              max={60}
              defaultValue={idea.duration_minutes ?? 10}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Salvar
          </button>

          <span className="text-xs text-neutral-500">Salva e recarrega a página (server-first).</span>
        </div>
      </form>
    </div>
  )
}
