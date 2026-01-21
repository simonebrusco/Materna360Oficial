import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  createIdea,
  type AdmIdeaHub,
  type AdmIdeaStatus,
} from '@/app/lib/adm/adm.server'

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

export default function AdminIdeaNewPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const qsKeep = buildQueryString({
    hub: searchParams?.hub ?? '',
    status: searchParams?.status ?? '',
    q: searchParams?.q ?? '',
  })

  async function action(formData: FormData) {
    'use server'

    const hub = safeHub(String(formData.get('hub') ?? ''))
    const status = safeStatus(String(formData.get('status') ?? ''))
    const title = String(formData.get('title') ?? '').trim()
    const short_description = String(formData.get('short_description') ?? '').trim()
    const duration_minutes = Number(formData.get('duration_minutes') ?? 10)

    if (!title) {
      redirect(`/admin/ideas/new${qsKeep}`)
    }

    const created = await createIdea({
      hub,
      status,
      title,
      short_description,
      duration_minutes: Number.isFinite(duration_minutes) ? duration_minutes : 10,
      // MVP: campos avançados podem ser adicionados depois
      steps: '',
      tags: '',
      environment: null,
      age_band: null,
    })

    redirect(`/admin/ideas/${created.id}${qsKeep}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Nova ideia</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Criar ideia curada (MVP). ID é gerado automaticamente.
          </p>
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

      <form action={action} className="rounded-lg border bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700">Hub</label>
            <select
              name="hub"
              defaultValue={safeHub(searchParams?.hub)}
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
              defaultValue={safeStatus(searchParams?.status)}
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
            placeholder="Ex: Caça às cores pela casa"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Descrição curta</label>
          <textarea
            name="short_description"
            placeholder="Uma frase prática e acolhedora."
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
              defaultValue={10}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Criar
          </button>

          <span className="text-xs text-neutral-500">
            Após criar, você será redirecionada para a tela de edição.
          </span>
        </div>
      </form>
    </div>
  )
}
